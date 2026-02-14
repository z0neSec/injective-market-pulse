/**
 * Normalized market representation — unified across spot and derivative markets.
 */
export interface NormalizedMarket {
  marketId: string;
  ticker: string;
  type: 'spot' | 'derivative';
  baseDenom: string;
  quoteDenom: string;
  baseTokenSymbol: string;
  quoteTokenSymbol: string;
  baseDecimals: number;
  quoteDecimals: number;
  minPriceTickSize: number;
  minQuantityTickSize: number;
  status: string;
  makerFeeRate: string;
  takerFeeRate: string;
}

/**
 * Orderbook level with human-readable values.
 */
export interface OrderbookLevel {
  price: number;
  quantity: number;
  total: number; // cumulative quantity
  notional: number; // price * quantity (USD value)
}

/**
 * Processed orderbook with computed metrics.
 */
export interface ProcessedOrderbook {
  marketId: string;
  ticker: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  metrics: OrderbookMetrics;
  timestamp: string;
}

export interface OrderbookMetrics {
  midPrice: number;
  bestBid: number;
  bestAsk: number;
  absoluteSpread: number;
  relativeSpreadBps: number;
  bidDepthTotal: number;
  askDepthTotal: number;
  bidDepthNotional: number;
  askDepthNotional: number;
  depthImbalance: number;
}

/**
 * Normalized trade representation.
 */
export interface NormalizedTrade {
  tradeId: string;
  marketId: string;
  price: number;
  quantity: number;
  notional: number;
  side: 'buy' | 'sell';
  executedAt: string;
  fee: string;
}

/**
 * Trade statistics computed from recent trades.
 */
export interface TradeStats {
  marketId: string;
  ticker: string;
  period: string;
  totalTrades: number;
  totalVolume: number;
  totalNotional: number;
  avgPrice: number;
  avgTradeSize: number;
  highPrice: number;
  lowPrice: number;
  priceChange: number;
  priceChangePercent: number;
  buyCount: number;
  sellCount: number;
  buySellRatio: number;
  volatility: number;
  trades: NormalizedTrade[];
}

/**
 * Health score breakdown for a market.
 */
export interface MarketHealth {
  marketId: string;
  ticker: string;
  type: 'spot' | 'derivative';
  healthScore: number;
  healthGrade: string;
  metrics: {
    liquidity: {
      score: number;
      bidDepthNotional: number;
      askDepthNotional: number;
      depthImbalance: number;
    };
    spread: {
      score: number;
      absoluteSpread: number;
      relativeSpreadBps: number;
      midPrice: number;
    };
    volatility: {
      score: number;
      recentVolatility: number;
      tradeFrequency: number;
      avgTradeSize: number;
    };
    activity: {
      score: number;
      recentTrades: number;
      recentVolume: number;
    };
  };
  computedAt: string;
}

/**
 * Market summary — single endpoint combining market + orderbook + trades.
 */
export interface MarketSummary {
  market: NormalizedMarket;
  orderbook: OrderbookMetrics;
  tradeStats: {
    totalTrades: number;
    totalVolume: number;
    avgPrice: number;
    highPrice: number;
    lowPrice: number;
    priceChange: number;
    priceChangePercent: number;
    volatility: number;
  };
  health: {
    score: number;
    grade: string;
  };
  timestamp: string;
}

/**
 * Cross-market analytics overview.
 */
export interface AnalyticsOverview {
  totalMarkets: number;
  activeSpotMarkets: number;
  activeDerivativeMarkets: number;
  totalVolume24h: number;
  avgHealthScore: number;
  topMarketByVolume: { ticker: string; volume: number } | null;
  topMarketByLiquidity: { ticker: string; depth: number } | null;
  timestamp: string;
}

/**
 * Market ranking entry.
 */
export interface MarketRanking {
  rank: number;
  marketId: string;
  ticker: string;
  type: 'spot' | 'derivative';
  value: number;
  metric: string;
}

/**
 * Side-by-side market comparison entry.
 */
export interface MarketComparisonEntry {
  marketId: string;
  ticker: string;
  type: 'spot' | 'derivative';
  midPrice: number;
  spreadBps: number;
  liquidityDepth: number;
  volume: number;
  volatility: number;
  healthScore: number;
  healthGrade: string;
}

/**
 * Result of comparing multiple markets.
 */
export interface MarketComparison {
  markets: MarketComparisonEntry[];
  bestBySpread: string;
  bestByLiquidity: string;
  bestByHealth: string;
  comparedAt: string;
}
