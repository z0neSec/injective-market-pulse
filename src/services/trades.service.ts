/**
 * Trades Service
 *
 * Fetches recent trades and computes statistics: volume, volatility,
 * price change, buy/sell ratio.
 */

import { spotApi, derivativeApi } from '../clients';
import { cacheGetOrSet, cacheTTL } from './cache.service';
import { getMarketById } from './market.service';
import { NormalizedTrade, TradeStats, NormalizedMarket } from '../types';
import { MarketNotFoundError, InjectiveClientError } from '../utils/errors';
import {
  spotPriceToHuman,
  spotQuantityToHuman,
  derivativePriceToHuman,
  toFixedSafe,
} from '../utils/decimals';
import { realizedVolatility } from '../utils/math';

/**
 * Get recent trades with computed statistics for a market.
 */
export async function getTradeStats(
  marketId: string,
  limit: number = 100
): Promise<TradeStats> {
  const market = await getMarketById(marketId);
  if (!market) throw new MarketNotFoundError(marketId);

  const cacheKey = `trades:${marketId}:${limit}`;
  const { data } = await cacheGetOrSet(cacheKey, cacheTTL.trades, async () => {
    return fetchAndProcessTrades(market, limit);
  });
  return data;
}

// ─── Internal ─────────────────────────────────────

async function fetchAndProcessTrades(
  market: NormalizedMarket,
  limit: number
): Promise<TradeStats> {
  try {
    const api = market.type === 'spot' ? spotApi : derivativeApi;
    const result = await api.fetchTrades({ marketId: market.marketId, pagination: { limit } as any });
    const rawTrades = result.trades || [];

    const trades = rawTrades.map((t: any) => normalizeTrade(t, market));

    return computeTradeStats(market, trades);
  } catch (err: any) {
    if (err instanceof MarketNotFoundError) throw err;
    throw new InjectiveClientError(err.message || 'Failed to fetch trades');
  }
}

function normalizeTrade(t: any, market: NormalizedMarket): NormalizedTrade {
  let price: number;
  let quantity: number;

  if (market.type === 'spot') {
    // Spot prices are in chain format: multiply by 10^(baseDecimals - quoteDecimals)
    price = spotPriceToHuman(t.price || '0', market.baseDecimals, market.quoteDecimals);
    // Spot quantities are in chain format: divide by 10^baseDecimals
    quantity = spotQuantityToHuman(t.quantity || '0', market.baseDecimals);
  } else {
    // Derivative prices are in chain format: divide by 10^quoteDecimals
    price = derivativePriceToHuman(t.executionPrice || t.price || '0', market.quoteDecimals);
    // Derivative quantities are already human-readable
    quantity = parseFloat(t.executionQuantity || t.quantity || '0');
  }

  const notional = toFixedSafe(price * quantity, 2);

  return {
    tradeId: t.tradeId || '',
    marketId: market.marketId,
    price: toFixedSafe(price, 8),
    quantity: toFixedSafe(quantity, 6),
    notional,
    side: t.tradeDirection === 'buy' ? 'buy' : 'sell',
    executedAt: t.executedAt
      ? new Date(parseInt(t.executedAt)).toISOString()
      : new Date().toISOString(),
    fee: t.fee || '0',
  };
}

function computeTradeStats(market: NormalizedMarket, trades: NormalizedTrade[]): TradeStats {
  if (trades.length === 0) {
    return emptyStats(market);
  }

  const prices = trades.map((t) => t.price);
  const quantities = trades.map((t) => t.quantity);
  const notionals = trades.map((t) => t.notional);

  const totalVolume = toFixedSafe(
    quantities.reduce((s, q) => s + q, 0),
    6
  );
  const totalNotional = toFixedSafe(
    notionals.reduce((s, n) => s + n, 0),
    2
  );
  const avgPrice = toFixedSafe(
    prices.reduce((s, p) => s + p, 0) / prices.length,
    8
  );
  const avgTradeSize = toFixedSafe(totalVolume / trades.length, 6);
  const highPrice = toFixedSafe(Math.max(...prices), 8);
  const lowPrice = toFixedSafe(Math.min(...prices), 8);

  // Price change: last trade vs first trade in the window
  const oldestPrice = prices[prices.length - 1];
  const newestPrice = prices[0];
  const priceChange = toFixedSafe(newestPrice - oldestPrice, 8);
  const priceChangePercent =
    oldestPrice > 0 ? toFixedSafe((priceChange / oldestPrice) * 100, 4) : 0;

  const buyCount = trades.filter((t) => t.side === 'buy').length;
  const sellCount = trades.filter((t) => t.side === 'sell').length;
  const buySellRatio = sellCount > 0 ? toFixedSafe(buyCount / sellCount, 4) : buyCount > 0 ? Infinity : 0;

  const vol = toFixedSafe(realizedVolatility(prices), 6);

  return {
    marketId: market.marketId,
    ticker: market.ticker,
    period: `last_${trades.length}_trades`,
    totalTrades: trades.length,
    totalVolume,
    totalNotional,
    avgPrice,
    avgTradeSize,
    highPrice,
    lowPrice,
    priceChange,
    priceChangePercent,
    buyCount,
    sellCount,
    buySellRatio,
    volatility: vol,
    trades,
  };
}

function emptyStats(market: NormalizedMarket): TradeStats {
  return {
    marketId: market.marketId,
    ticker: market.ticker,
    period: 'no_data',
    totalTrades: 0,
    totalVolume: 0,
    totalNotional: 0,
    avgPrice: 0,
    avgTradeSize: 0,
    highPrice: 0,
    lowPrice: 0,
    priceChange: 0,
    priceChangePercent: 0,
    buyCount: 0,
    sellCount: 0,
    buySellRatio: 0,
    volatility: 0,
    trades: [],
  };
}
