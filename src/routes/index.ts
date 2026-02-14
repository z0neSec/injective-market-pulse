/**
 * Root Route Registration
 *
 * Mounts all API versions under /api/v{n}
 */

import { FastifyInstance } from 'fastify';
import { v1Routes } from './v1';

export async function registerRoutes(app: FastifyInstance) {
  app.register(v1Routes, { prefix: '/api/v1' });
}
