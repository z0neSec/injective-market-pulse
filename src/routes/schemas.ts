/**
 * Shared OpenAPI JSON Schema definitions for Fastify route schemas.
 *
 * Keeps route files clean while providing rich Swagger documentation.
 */

// ── Reusable building blocks ──────────────────────

export const metaSchema = {
  type: 'object',
  properties: {
    timestamp: { type: 'string', format: 'date-time' },
    dataFreshness: { type: 'string', example: '30s' },
    source: { type: 'string', example: 'injective-mainnet' },
    apiVersion: { type: 'string', example: 'v1' },
  },
} as const;

export const errorResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        statusCode: { type: 'number' },
      },
    },
    meta: metaSchema,
  },
} as const;

const marketSchema = {
  type: 'object',
  properties: {
    marketId: { type: 'string' },
    ticker: { type: 'string', example: 'INJ/USDT' },
    type: { type: 'string', enum: ['spot', 'derivative'] },
    baseDenom: { type: 'string' },
    quoteDenom: { type: 'string' },
    baseTokenSymbol: { type: 'string', example: 'INJ' },
    quoteTokenSymbol: { type: 'string', example: 'USDT' },
    baseDecimals: { type: 'number' },
    quoteDecimals: { type: 'number' },
    minPriceTickSize: { type: 'number' },
    minQuantityTickSize: { type: 'number' },
    status: { type: 'string' },
    makerFeeRate: { type: 'string' },
    takerFeeRate: { type: 'string' },
  },
} as const;

const orderbookLevelSchema = {
  type: 'object',
  properties: {
    price: { type: 'number' },
    quantity: { type: 'number' },
    total: { type: 'number' },
    notional: { type: 'number' },
  },
} as const;

const orderbookMetricsSchema = {
  type: 'object',
  properties: {
    midPrice: { type: 'number' },
    bestBid: { type: 'number' },
    bestAsk: { type: 'number' },
    absoluteSpread: { type: 'number' },
    relativeSpreadBps: { type: 'number' },
    bidDepthTotal: { type: 'number' },
    askDepthTotal: { type: 'number' },
    bidDepthNotional: { type: 'number' },
    askDepthNotional: { type: 'number' },
    depthImbalance: { type: 'number' },
  },
} as const;

// ── Response schemas per endpoint ─────────────────

export const marketsListResponse = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          markets: { type: 'array', items: marketSchema },
          total: { type: 'number' },
          pagination: {
            type: 'object',
            properties: {
              limit: { type: 'number' },
              offset: { type: 'number' },
              hasMore: { type: 'boolean' },
            },
          },
        },
      },
      meta: metaSchema,
    },
  },
  400: errorResponseSchema,
} as const;

export const marketDetailResponse = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: marketSchema,
      meta: metaSchema,
    },
  },
  404: errorResponseSchema,
} as const;

export const orderbookResponse = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          marketId: { type: 'string' },
          ticker: { type: 'string' },
          bids: { type: 'array', items: orderbookLevelSchema },
          asks: { type: 'array', items: orderbookLevelSchema },
          metrics: orderbookMetricsSchema,
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      meta: metaSchema,
    },
  },
  404: errorResponseSchema,
} as const;

export const tradesResponse = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          marketId: { type: 'string' },
          ticker: { type: 'string' },
          period: { type: 'string' },
          totalTrades: { type: 'number' },
          totalVolume: { type: 'number' },
          totalNotional: { type: 'number' },
          avgPrice: { type: 'number' },
          avgTradeSize: { type: 'number' },
          highPrice: { type: 'number' },
          lowPrice: { type: 'number' },
          priceChange: { type: 'number' },
          priceChangePercent: { type: 'number' },
          buyCount: { type: 'number' },
          sellCount: { type: 'number' },
          buySellRatio: { type: 'number' },
          volatility: { type: 'number' },
          trades: { type: 'array' },
        },
      },
      meta: metaSchema,
    },
  },
  404: errorResponseSchema,
} as const;

export const healthResponse = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          marketId: { type: 'string' },
          ticker: { type: 'string' },
          type: { type: 'string', enum: ['spot', 'derivative'] },
          healthScore: { type: 'number', minimum: 0, maximum: 100 },
          healthGrade: { type: 'string', enum: ['A+', 'A', 'B', 'C', 'D', 'F'] },
          metrics: {
            type: 'object',
            properties: {
              liquidity: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  bidDepthNotional: { type: 'number' },
                  askDepthNotional: { type: 'number' },
                  depthImbalance: { type: 'number' },
                },
              },
              spread: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  absoluteSpread: { type: 'number' },
                  relativeSpreadBps: { type: 'number' },
                  midPrice: { type: 'number' },
                },
              },
              volatility: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  recentVolatility: { type: 'number' },
                  tradeFrequency: { type: 'number' },
                  avgTradeSize: { type: 'number' },
                },
              },
              activity: {
                type: 'object',
                properties: {
                  score: { type: 'number' },
                  recentTrades: { type: 'number' },
                  recentVolume: { type: 'number' },
                },
              },
            },
          },
          computedAt: { type: 'string', format: 'date-time' },
        },
      },
      meta: metaSchema,
    },
  },
  404: errorResponseSchema,
} as const;

export const summaryResponse = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          market: marketSchema,
          orderbook: orderbookMetricsSchema,
          tradeStats: {
            type: 'object',
            properties: {
              totalTrades: { type: 'number' },
              totalVolume: { type: 'number' },
              avgPrice: { type: 'number' },
              highPrice: { type: 'number' },
              lowPrice: { type: 'number' },
              priceChange: { type: 'number' },
              priceChangePercent: { type: 'number' },
              volatility: { type: 'number' },
            },
          },
          health: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              grade: { type: 'string' },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      meta: metaSchema,
    },
  },
  404: errorResponseSchema,
} as const;

export const overviewResponse = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          totalMarkets: { type: 'number' },
          activeSpotMarkets: { type: 'number' },
          activeDerivativeMarkets: { type: 'number' },
          totalVolume24h: { type: 'number' },
          avgHealthScore: { type: 'number' },
          topMarketByVolume: {
            type: 'object',
            nullable: true,
            properties: { ticker: { type: 'string' }, volume: { type: 'number' } },
          },
          topMarketByLiquidity: {
            type: 'object',
            nullable: true,
            properties: { ticker: { type: 'string' }, depth: { type: 'number' } },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      meta: metaSchema,
    },
  },
} as const;

export const rankingsResponse = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          rankings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rank: { type: 'number' },
                marketId: { type: 'string' },
                ticker: { type: 'string' },
                type: { type: 'string', enum: ['spot', 'derivative'] },
                value: { type: 'number' },
                metric: { type: 'string' },
              },
            },
          },
          metric: { type: 'string' },
          type: { type: 'string' },
        },
      },
      meta: metaSchema,
    },
  },
  400: errorResponseSchema,
} as const;

export const compareResponse = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          markets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                marketId: { type: 'string' },
                ticker: { type: 'string' },
                type: { type: 'string', enum: ['spot', 'derivative'] },
                midPrice: { type: 'number' },
                spreadBps: { type: 'number' },
                liquidityDepth: { type: 'number' },
                volume: { type: 'number' },
                volatility: { type: 'number' },
                healthScore: { type: 'number' },
                healthGrade: { type: 'string' },
              },
            },
          },
          bestBySpread: { type: 'string' },
          bestByLiquidity: { type: 'string' },
          bestByHealth: { type: 'string' },
          comparedAt: { type: 'string', format: 'date-time' },
        },
      },
      meta: metaSchema,
    },
  },
  400: errorResponseSchema,
} as const;

export const statusResponse = {
  200: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'healthy' },
          uptime: { type: 'number' },
          startedAt: { type: 'string', format: 'date-time' },
          network: { type: 'string' },
          endpoints: {
            type: 'object',
            properties: {
              indexer: { type: 'string' },
              grpc: { type: 'string' },
            },
          },
          cache: {
            type: 'object',
            properties: {
              keys: { type: 'number' },
              hits: { type: 'number' },
              misses: { type: 'number' },
              hitRate: { type: 'number' },
            },
          },
          version: { type: 'string' },
        },
      },
      meta: metaSchema,
    },
  },
} as const;
