/**
 * V1 Status Routes
 */

import { FastifyInstance } from 'fastify';
import { getStatus } from '../../controllers/status.controller';
import { statusResponse } from '../schemas';

export async function statusRoutes(app: FastifyInstance) {
  app.get('/status', {
    schema: {
      description: 'API health check — returns server status, cache stats, and uptime',
      tags: ['System'],
      response: statusResponse,
    },
    handler: getStatus,
  });
}
