/**
 * V1 Analytics Routes
 */

import { FastifyInstance } from 'fastify';
import {
  getAnalyticsOverview,
  getAnalyticsRankings,
  getMarketComparison,
} from '../../controllers/analytics.controller';

export async function analyticsRoutes(app: FastifyInstance) {
  app.get('/analytics/overview', {
    schema: {
      description: 'Get ecosystem-wide overview: total markets, volume, average health score',
      tags: ['Analytics'],
    },
    handler: getAnalyticsOverview,
  });

  app.get('/analytics/rankings', {
    schema: {
      description: 'Get markets ranked by a specific metric',
      tags: ['Analytics'],
      querystring: {
        type: 'object',
        properties: {
          metric: {
            type: 'string',
            enum: ['volume', 'liquidity', 'health', 'spread', 'volatility'],
            description: 'Ranking metric (default: volume)',
          },
          type: {
            type: 'string',
            enum: ['spot', 'derivative'],
            description: 'Filter by market type',
          },
          limit: {
            type: 'string',
            description: 'Number of results (default: 10)',
          },
        },
      },
    },
    handler: getAnalyticsRankings,
  });

  app.get('/analytics/compare', {
    schema: {
      description: 'Compare 2-5 markets side-by-side across key metrics (spread, liquidity, health, volatility)',
      tags: ['Analytics'],
      querystring: {
        type: 'object',
        properties: {
          markets: {
            type: 'string',
            description: 'Comma-separated market IDs to compare (2-5 IDs)',
          },
        },
        required: ['markets'],
      },
    },
    handler: getMarketComparison,
  });
}
