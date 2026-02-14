/**
 * Market Service
 *
 * Fetches and normalizes spot + derivative markets from Injective
 * into a unified format with human-readable values.
 */

import { spotApi, derivativeApi } from '../clients';
import { cacheGetOrSet, cacheTTL } from './cache.service';
import { NormalizedMarket } from '../types';
import { InjectiveClientError } from '../utils/errors';

/**
 * Fetch all spot markets, normalized.
 */
export async function getSpotMarkets(): Promise<NormalizedMarket[]> {
  const { data } = await cacheGetOrSet('markets:spot', cacheTTL.markets, async () => {
    try {
      const markets = await spotApi.fetchMarkets({});
      return markets
        .filter((m: any) => m.marketStatus === 'active')
        .map((m: any) => normalizeSpotMarket(m));
    } catch (err: any) {
      throw new InjectiveClientError(err.message || 'Failed to fetch spot markets');
    }
  });
  return data;
}

/**
 * Fetch all derivative markets, normalized.
 */
export async function getDerivativeMarkets(): Promise<NormalizedMarket[]> {
  const { data } = await cacheGetOrSet('markets:derivative', cacheTTL.markets, async () => {
    try {
      const markets = await derivativeApi.fetchMarkets({});
      return markets
        .filter((m: any) => m.marketStatus === 'active')
        .map((m: any) => normalizeDerivativeMarket(m));
    } catch (err: any) {
      throw new InjectiveClientError(err.message || 'Failed to fetch derivative markets');
    }
  });
  return data;
}

/**
 * Fetch all markets (spot + derivative), normalized.
 */
export async function getAllMarkets(): Promise<NormalizedMarket[]> {
  const [spot, derivative] = await Promise.all([
    getSpotMarkets(),
    getDerivativeMarkets(),
  ]);
  return [...spot, ...derivative];
}

/**
 * Get a single market by ID. Searches both spot and derivative.
 */
export async function getMarketById(marketId: string): Promise<NormalizedMarket | null> {
  const all = await getAllMarkets();
  return all.find((m) => m.marketId === marketId) || null;
}

/**
 * Get filtered and sorted markets.
 */
export async function getFilteredMarkets(filters: {
  type?: 'spot' | 'derivative';
  quote?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ markets: NormalizedMarket[]; total: number }> {
  let markets: NormalizedMarket[];

  if (filters.type === 'spot') {
    markets = await getSpotMarkets();
  } else if (filters.type === 'derivative') {
    markets = await getDerivativeMarkets();
  } else {
    markets = await getAllMarkets();
  }

  // Filter by quote token
  if (filters.quote) {
    const quote = filters.quote.toUpperCase();
    markets = markets.filter((m) => m.quoteTokenSymbol.toUpperCase() === quote);
  }

  // Search by ticker
  if (filters.search) {
    const search = filters.search.toLowerCase();
    markets = markets.filter((m) => m.ticker.toLowerCase().includes(search));
  }

  const total = markets.length;

  // Pagination
  const offset = filters.offset || 0;
  const limit = filters.limit || 50;
  markets = markets.slice(offset, offset + limit);

  return { markets, total };
}

// ─── Internal Helpers ─────────────────────────────

function normalizeSpotMarket(m: any): NormalizedMarket {
  return {
    marketId: m.marketId,
    ticker: m.ticker,
    type: 'spot',
    baseDenom: m.baseDenom,
    quoteDenom: m.quoteDenom,
    baseTokenSymbol: m.baseToken?.symbol || extractSymbol(m.ticker, 'base'),
    quoteTokenSymbol: m.quoteToken?.symbol || extractSymbol(m.ticker, 'quote'),
    baseDecimals: m.baseToken?.decimals ?? 18,
    quoteDecimals: m.quoteToken?.decimals ?? 6,
    minPriceTickSize: parseFloat(String(m.minPriceTickSize)) || 0,
    minQuantityTickSize: parseFloat(String(m.minQuantityTickSize)) || 0,
    status: m.marketStatus,
    makerFeeRate: m.makerFeeRate || '0',
    takerFeeRate: m.takerFeeRate || '0',
  };
}

function normalizeDerivativeMarket(m: any): NormalizedMarket {
  return {
    marketId: m.marketId,
    ticker: m.ticker,
    type: 'derivative',
    baseDenom: m.oracleBase || '',
    quoteDenom: m.quoteDenom,
    baseTokenSymbol: extractSymbol(m.ticker, 'base'),
    quoteTokenSymbol: m.quoteToken?.symbol || extractSymbol(m.ticker, 'quote'),
    baseDecimals: 18, // derivatives don't have baseToken.decimals
    quoteDecimals: m.quoteToken?.decimals ?? 6,
    minPriceTickSize: parseFloat(String(m.minPriceTickSize)) || 0,
    minQuantityTickSize: parseFloat(String(m.minQuantityTickSize)) || 0,
    status: m.marketStatus,
    makerFeeRate: m.makerFeeRate || '0',
    takerFeeRate: m.takerFeeRate || '0',
  };
}

/**
 * Extract base or quote symbol from a ticker like "INJ/USDT" or "INJ/USDT PERP".
 */
function extractSymbol(ticker: string, part: 'base' | 'quote'): string {
  const cleaned = ticker.replace(/\s*PERP$/i, '');
  const parts = cleaned.split('/');
  if (part === 'base') return parts[0]?.trim() || 'UNKNOWN';
  return parts[1]?.trim() || 'UNKNOWN';
}
