/**
 * V1 Route Aggregator
 */

import { FastifyInstance } from 'fastify';
import { marketRoutes } from './markets.routes';
import { analyticsRoutes } from './analytics.routes';
import { statusRoutes } from './status.routes';

export async function v1Routes(app: FastifyInstance) {
  app.register(marketRoutes);
  app.register(analyticsRoutes);
  app.register(statusRoutes);
}
