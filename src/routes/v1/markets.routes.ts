/**
 * V1 Market Routes
 */

import { FastifyInstance } from 'fastify';
import {
  listMarkets,
  listSpotMarkets,
  listDerivativeMarkets,
  getMarket,
  getMarketSummaryHandler,
  getMarketOrderbook,
  getMarketTrades,
  getMarketHealthHandler,
} from '../../controllers/markets.controller';

export async function marketRoutes(app: FastifyInstance) {
  // ── Market Discovery ──────────────────────────
  app.get('/markets', {
    schema: {
      description: 'List all markets (spot + derivative) with optional filters',
      tags: ['Markets'],
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['spot', 'derivative'], description: 'Filter by market type' },
          quote: { type: 'string', description: 'Filter by quote token symbol (e.g., USDT)' },
          search: { type: 'string', description: 'Search by ticker' },
          limit: { type: 'string', description: 'Max results (default: 50)' },
          offset: { type: 'string', description: 'Pagination offset (default: 0)' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                markets: { type: 'array' },
                total: { type: 'number' },
              },
            },
            meta: { type: 'object' },
          },
        },
      },
    },
    handler: listMarkets,
  });

  app.get('/markets/spot', {
    schema: {
      description: 'List all active spot markets',
      tags: ['Markets'],
    },
    handler: listSpotMarkets,
  });

  app.get('/markets/derivative', {
    schema: {
      description: 'List all active derivative markets',
      tags: ['Markets'],
    },
    handler: listDerivativeMarkets,
  });

  app.get('/markets/:marketId', {
    schema: {
      description: 'Get details for a specific market by ID',
      tags: ['Markets'],
      params: {
        type: 'object',
        properties: {
          marketId: { type: 'string', description: 'The Injective market ID (0x...)' },
        },
        required: ['marketId'],
      },
    },
    handler: getMarket,
  });

  // ── Market Intelligence ───────────────────────
  app.get('/markets/:marketId/summary', {
    schema: {
      description: 'Get full market summary: market info + orderbook metrics + trade stats + health score',
      tags: ['Market Intelligence'],
      params: {
        type: 'object',
        properties: {
          marketId: { type: 'string' },
        },
        required: ['marketId'],
      },
    },
    handler: getMarketSummaryHandler,
  });

  app.get('/markets/:marketId/orderbook', {
    schema: {
      description: 'Get normalized orderbook with computed depth, spread, and imbalance metrics',
      tags: ['Market Intelligence'],
      params: {
        type: 'object',
        properties: {
          marketId: { type: 'string' },
        },
        required: ['marketId'],
      },
      querystring: {
        type: 'object',
        properties: {
          depth: { type: 'string', description: 'Number of orderbook levels (default: 25, max: 50)' },
        },
      },
    },
    handler: getMarketOrderbook,
  });

  app.get('/markets/:marketId/trades', {
    schema: {
      description: 'Get recent trades with computed statistics (volume, volatility, price change)',
      tags: ['Market Intelligence'],
      params: {
        type: 'object',
        properties: {
          marketId: { type: 'string' },
        },
        required: ['marketId'],
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'string', description: 'Number of recent trades (default: 50, max: 100)' },
        },
      },
    },
    handler: getMarketTrades,
  });

  app.get('/markets/:marketId/health', {
    schema: {
      description: 'Get computed market health score (0-100) with breakdown of liquidity, spread, volatility, and activity',
      tags: ['Market Intelligence'],
      params: {
        type: 'object',
        properties: {
          marketId: { type: 'string' },
        },
        required: ['marketId'],
      },
    },
    handler: getMarketHealthHandler,
  });
}
