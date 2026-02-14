/**
 * Health Score Service
 *
 * Computes a composite market health score (0-100) by combining
 * liquidity, spread, volatility, and activity metrics.
 *
 * This is the core "derived intelligence" that Injective does NOT provide natively.
 */

import { cacheGetOrSet, cacheTTL } from './cache.service';
import { getMarketById } from './market.service';
import { getOrderbookMetrics } from './orderbook.service';
import { getTradeStats } from './trades.service';
import { MarketHealth } from '../types';
import { MarketNotFoundError } from '../utils/errors';
import { clamp, scoreToGrade, toFixedSafe } from '../utils';

// ─── Weights for composite score ──────────────────
const WEIGHTS = {
  liquidity: 0.30,
  spread: 0.25,
  volatility: 0.20,
  activity: 0.25,
};

/**
 * Compute health score for a single market.
 */
export async function getMarketHealth(marketId: string): Promise<MarketHealth> {
  const market = await getMarketById(marketId);
  if (!market) throw new MarketNotFoundError(marketId);

  const cacheKey = `health:${marketId}`;
  const { data } = await cacheGetOrSet(cacheKey, cacheTTL.health, async () => {
    const [obMetrics, tradeStats] = await Promise.all([
      getOrderbookMetrics(marketId),
      getTradeStats(marketId, 100),
    ]);

    // ── Liquidity Score (0-100) ──
    // Based on total notional depth and balance
    const totalDepth = obMetrics.bidDepthNotional + obMetrics.askDepthNotional;
    // Scale: $0 = 0, $500k+ = 100
    const depthScore = clamp((totalDepth / 500000) * 100, 0, 100);
    // Penalty for imbalance (0 = balanced, 1 = completely one-sided)
    const balancePenalty = obMetrics.depthImbalance * 30;
    const liquidityScore = clamp(depthScore - balancePenalty, 0, 100);

    // ── Spread Score (0-100) ──
    // Tighter spread = higher score
    // <5 bps = 100, >200 bps = 0
    const spreadBps = obMetrics.relativeSpreadBps;
    const spreadScore = spreadBps <= 0
      ? 0
      : clamp(100 - ((spreadBps - 5) / 195) * 100, 0, 100);

    // ── Volatility Score (0-100) ──
    // Moderate volatility is good. Too high or too low is bad.
    // Optimal range: 0.005-0.03
    const vol = tradeStats.volatility;
    let volatilityScore: number;
    if (vol < 0.001) {
      volatilityScore = 30; // Too quiet
    } else if (vol < 0.005) {
      volatilityScore = 60;
    } else if (vol <= 0.03) {
      volatilityScore = 90; // Sweet spot
    } else if (vol <= 0.08) {
      volatilityScore = 60;
    } else {
      volatilityScore = 20; // Too volatile
    }

    // Factor in trade frequency
    const freqBonus = clamp(tradeStats.totalTrades / 2, 0, 20);
    volatilityScore = clamp(volatilityScore + freqBonus, 0, 100);

    // ── Activity Score (0-100) ──
    // Based on trade count and volume
    const tradeCountScore = clamp((tradeStats.totalTrades / 100) * 80, 0, 80);
    const volumeScore = clamp((tradeStats.totalNotional / 100000) * 20, 0, 20);
    const activityScore = clamp(tradeCountScore + volumeScore, 0, 100);

    // ── Composite ──
    const healthScore = Math.round(
      liquidityScore * WEIGHTS.liquidity +
      spreadScore * WEIGHTS.spread +
      volatilityScore * WEIGHTS.volatility +
      activityScore * WEIGHTS.activity
    );

    const result: MarketHealth = {
      marketId: market.marketId,
      ticker: market.ticker,
      type: market.type,
      healthScore: clamp(healthScore, 0, 100),
      healthGrade: scoreToGrade(healthScore),
      metrics: {
        liquidity: {
          score: Math.round(liquidityScore),
          bidDepthNotional: obMetrics.bidDepthNotional,
          askDepthNotional: obMetrics.askDepthNotional,
          depthImbalance: obMetrics.depthImbalance,
        },
        spread: {
          score: Math.round(spreadScore),
          absoluteSpread: obMetrics.absoluteSpread,
          relativeSpreadBps: obMetrics.relativeSpreadBps,
          midPrice: obMetrics.midPrice,
        },
        volatility: {
          score: Math.round(volatilityScore),
          recentVolatility: tradeStats.volatility,
          tradeFrequency: tradeStats.totalTrades,
          avgTradeSize: tradeStats.avgTradeSize,
        },
        activity: {
          score: Math.round(activityScore),
          recentTrades: tradeStats.totalTrades,
          recentVolume: tradeStats.totalNotional,
        },
      },
      computedAt: new Date().toISOString(),
    };

    return result;
  });

  return data;
}
