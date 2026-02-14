/**
 * Status Controller
 *
 * Handles /v1/status health check endpoint.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { activeEndpoints } from '../clients';
import { cacheStats } from '../services';
import { successResponse } from '../utils/response';

const startedAt = new Date().toISOString();

/**
 * GET /v1/status
 */
export async function getStatus(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  return reply.send(
    successResponse({
      status: 'healthy',
      uptime: process.uptime(),
      startedAt,
      network: activeEndpoints.network,
      endpoints: {
        indexer: activeEndpoints.indexer,
        grpc: activeEndpoints.grpc,
      },
      cache: cacheStats(),
      version: '1.0.0',
    })
  );
}
