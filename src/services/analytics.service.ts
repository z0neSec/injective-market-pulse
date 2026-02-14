/**
 * Analytics Service
 *
 * Cross-market analytics: overview, rankings, comparisons.
 * Aggregates data from multiple markets into ecosystem-wide insights.
 */

import { cacheGetOrSet, cacheTTL } from './cache.service';
import { getAllMarkets } from './market.service';
import { getOrderbookMetrics } from './orderbook.service';
import { getTradeStats } from './trades.service';
import { getMarketHealth } from './health.service';
import { AnalyticsOverview, MarketRanking, NormalizedMarket, MarketSummary } from '../types';
import { toFixedSafe } from '../utils/decimals';

/**
 * Get ecosystem-wide overview.
 */
export async function getOverview(): Promise<AnalyticsOverview> {
  const { data } = await cacheGetOrSet('analytics:overview', cacheTTL.analytics, async () => {
    const markets = await getAllMarkets();
    const spotMarkets = markets.filter((m) => m.type === 'spot');
    const derivMarkets = markets.filter((m) => m.type === 'derivative');

    // Fetch trade stats for top markets (limit to avoid overload)
    const topMarkets = markets.slice(0, 30);
    const tradeResults = await Promise.allSettled(
      topMarkets.map((m) => getTradeStats(m.marketId, 50))
    );

    let totalVolume = 0;
    let topByVolume: { ticker: string; volume: number } | null = null;

    for (const result of tradeResults) {
      if (result.status === 'fulfilled') {
        const stats = result.value;
        totalVolume += stats.totalNotional;
        if (!topByVolume || stats.totalNotional > topByVolume.volume) {
          topByVolume = { ticker: stats.ticker, volume: toFixedSafe(stats.totalNotional, 2) };
        }
      }
    }

    // Fetch orderbook depth for top markets
    const obResults = await Promise.allSettled(
      topMarkets.slice(0, 15).map((m) => getOrderbookMetrics(m.marketId))
    );

    let topByLiquidity: { ticker: string; depth: number } | null = null;

    for (let i = 0; i < obResults.length; i++) {
      const result = obResults[i];
      if (result.status === 'fulfilled') {
        const depth = result.value.bidDepthNotional + result.value.askDepthNotional;
        if (!topByLiquidity || depth > topByLiquidity.depth) {
          topByLiquidity = { ticker: topMarkets[i].ticker, depth: toFixedSafe(depth, 2) };
        }
      }
    }

    // Sample health scores
    const healthResults = await Promise.allSettled(
      topMarkets.slice(0, 10).map((m) => getMarketHealth(m.marketId))
    );

    const healthScores = healthResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value.healthScore);

    const avgHealth =
      healthScores.length > 0
        ? Math.round(healthScores.reduce((s, h) => s + h, 0) / healthScores.length)
        : 0;

    return {
      totalMarkets: markets.length,
      activeSpotMarkets: spotMarkets.length,
      activeDerivativeMarkets: derivMarkets.length,
      totalVolume24h: toFixedSafe(totalVolume, 2),
      avgHealthScore: avgHealth,
      topMarketByVolume: topByVolume,
      topMarketByLiquidity: topByLiquidity,
      timestamp: new Date().toISOString(),
    };
  });

  return data;
}

/**
 * Get market rankings by a specific metric.
 */
export async function getRankings(
  metric: 'volume' | 'liquidity' | 'health' | 'spread' | 'volatility',
  type?: 'spot' | 'derivative',
  limit: number = 10
): Promise<MarketRanking[]> {
  const cacheKey = `analytics:rankings:${metric}:${type || 'all'}:${limit}`;
  const { data } = await cacheGetOrSet(cacheKey, cacheTTL.analytics, async () => {
    let markets = await getAllMarkets();
    if (type) markets = markets.filter((m) => m.type === type);

    // Limit to manageable set
    const subset = markets.slice(0, 30);

    const entries: { market: NormalizedMarket; value: number }[] = [];

    if (metric === 'volume' || metric === 'volatility') {
      const results = await Promise.allSettled(
        subset.map((m) => getTradeStats(m.marketId, 100))
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          const value =
            metric === 'volume'
              ? result.value.totalNotional
              : result.value.volatility;
          entries.push({ market: subset[i], value });
        }
      }
    } else if (metric === 'liquidity' || metric === 'spread') {
      const results = await Promise.allSettled(
        subset.map((m) => getOrderbookMetrics(m.marketId))
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          const value =
            metric === 'liquidity'
              ? result.value.bidDepthNotional + result.value.askDepthNotional
              : result.value.relativeSpreadBps;
          entries.push({ market: subset[i], value });
        }
      }
    } else if (metric === 'health') {
      const results = await Promise.allSettled(
        subset.map((m) => getMarketHealth(m.marketId))
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          entries.push({ market: subset[i], value: result.value.healthScore });
        }
      }
    }

    // Sort: for spread, lower is better (ascending); for others, higher is better (descending)
    const ascending = metric === 'spread';
    entries.sort((a, b) => (ascending ? a.value - b.value : b.value - a.value));

    return entries.slice(0, limit).map((e, i) => ({
      rank: i + 1,
      marketId: e.market.marketId,
      ticker: e.market.ticker,
      type: e.market.type,
      value: toFixedSafe(e.value, 6),
      metric,
    }));
  });

  return data;
}

/**
 * Get a full summary for a single market (combines market + orderbook + trades + health).
 */
export async function getMarketSummary(marketId: string): Promise<MarketSummary> {
  const { getMarketById } = await import('./market.service');
  const market = await getMarketById(marketId);
  if (!market) {
    const { MarketNotFoundError } = await import('../utils/errors');
    throw new MarketNotFoundError(marketId);
  }

  const cacheKey = `summary:${marketId}`;
  const { data } = await cacheGetOrSet(cacheKey, cacheTTL.health, async () => {
    const [obMetrics, tradeStats, health] = await Promise.all([
      getOrderbookMetrics(marketId),
      getTradeStats(marketId, 100),
      getMarketHealth(marketId),
    ]);

    return {
      market,
      orderbook: obMetrics,
      tradeStats: {
        totalTrades: tradeStats.totalTrades,
        totalVolume: tradeStats.totalNotional,
        avgPrice: tradeStats.avgPrice,
        highPrice: tradeStats.highPrice,
        lowPrice: tradeStats.lowPrice,
        priceChange: tradeStats.priceChange,
        priceChangePercent: tradeStats.priceChangePercent,
        volatility: tradeStats.volatility,
      },
      health: {
        score: health.healthScore,
        grade: health.healthGrade,
      },
      timestamp: new Date().toISOString(),
    };
  });

  return data;
}
