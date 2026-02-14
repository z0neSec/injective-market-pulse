/**
 * Orderbook Service
 *
 * Fetches orderbooks from Injective and computes depth, spread,
 * and imbalance metrics.
 */

import { spotApi, derivativeApi } from '../clients';
import { cacheGetOrSet, cacheTTL } from './cache.service';
import { getMarketById } from './market.service';
import { ProcessedOrderbook, OrderbookLevel, OrderbookMetrics, NormalizedMarket } from '../types';
import { MarketNotFoundError, InjectiveClientError } from '../utils/errors';
import {
  spotPriceToHuman,
  spotQuantityToHuman,
  derivativePriceToHuman,
  toFixedSafe,
} from '../utils/decimals';
import { relativeSpreadBps, depthImbalance } from '../utils/math';

/**
 * Get processed orderbook for a market with computed metrics.
 */
export async function getOrderbook(
  marketId: string,
  depth: number = 25
): Promise<ProcessedOrderbook> {
  const market = await getMarketById(marketId);
  if (!market) throw new MarketNotFoundError(marketId);

  const cacheKey = `orderbook:${marketId}:${depth}`;
  const { data } = await cacheGetOrSet(cacheKey, cacheTTL.orderbook, async () => {
    return fetchAndProcessOrderbook(market, depth);
  });
  return data;
}

/**
 * Get only orderbook metrics (no raw levels) — useful for health scores.
 */
export async function getOrderbookMetrics(marketId: string): Promise<OrderbookMetrics> {
  const ob = await getOrderbook(marketId, 25);
  return ob.metrics;
}

// ─── Internal ─────────────────────────────────────

async function fetchAndProcessOrderbook(
  market: NormalizedMarket,
  depth: number
): Promise<ProcessedOrderbook> {
  try {
    const api = market.type === 'spot' ? spotApi : derivativeApi;
    const raw = await api.fetchOrderbookV2(market.marketId);

    const bids = processLevels(raw.buys || [], market, depth);
    const asks = processLevels(raw.sells || [], market, depth);
    const metrics = computeMetrics(bids, asks);

    return {
      marketId: market.marketId,
      ticker: market.ticker,
      bids,
      asks,
      metrics,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    if (err instanceof MarketNotFoundError) throw err;
    throw new InjectiveClientError(err.message || 'Failed to fetch orderbook');
  }
}

function processLevels(
  rawLevels: any[],
  market: NormalizedMarket,
  depth: number
): OrderbookLevel[] {
  const levels: OrderbookLevel[] = [];
  let cumulative = 0;

  const sliced = rawLevels.slice(0, depth);

  for (const level of sliced) {
    let price: number;
    let quantity: number;

    if (market.type === 'spot') {
      // Spot prices are in chain format: multiply by 10^(baseDecimals - quoteDecimals)
      price = spotPriceToHuman(level.price, market.baseDecimals, market.quoteDecimals);
      // Spot quantities are in chain format: divide by 10^baseDecimals
      quantity = spotQuantityToHuman(level.quantity, market.baseDecimals);
    } else {
      // Derivative prices are in chain format: divide by 10^quoteDecimals
      price = derivativePriceToHuman(level.price, market.quoteDecimals);
      // Derivative quantities are already human-readable
      quantity = parseFloat(level.quantity);
    }

    cumulative += quantity;
    const notional = toFixedSafe(price * quantity, 2);

    levels.push({
      price: toFixedSafe(price, 8),
      quantity: toFixedSafe(quantity, 6),
      total: toFixedSafe(cumulative, 6),
      notional,
    });
  }

  return levels;
}

function computeMetrics(bids: OrderbookLevel[], asks: OrderbookLevel[]): OrderbookMetrics {
  const bestBid = bids.length > 0 ? bids[0].price : 0;
  const bestAsk = asks.length > 0 ? asks[0].price : 0;
  const midPrice = bestBid > 0 && bestAsk > 0 ? toFixedSafe((bestBid + bestAsk) / 2, 8) : 0;
  const absoluteSpread = bestAsk > 0 && bestBid > 0 ? toFixedSafe(bestAsk - bestBid, 8) : 0;

  const bidDepthTotal = bids.length > 0 ? bids[bids.length - 1].total : 0;
  const askDepthTotal = asks.length > 0 ? asks[asks.length - 1].total : 0;

  const bidDepthNotional = toFixedSafe(
    bids.reduce((sum, l) => sum + l.notional, 0),
    2
  );
  const askDepthNotional = toFixedSafe(
    asks.reduce((sum, l) => sum + l.notional, 0),
    2
  );

  return {
    midPrice,
    bestBid: toFixedSafe(bestBid, 8),
    bestAsk: toFixedSafe(bestAsk, 8),
    absoluteSpread,
    relativeSpreadBps: toFixedSafe(relativeSpreadBps(bestBid, bestAsk), 2),
    bidDepthTotal: toFixedSafe(bidDepthTotal, 6),
    askDepthTotal: toFixedSafe(askDepthTotal, 6),
    bidDepthNotional,
    askDepthNotional,
    depthImbalance: toFixedSafe(
      depthImbalance(bidDepthNotional, askDepthNotional),
      4
    ),
  };
}
