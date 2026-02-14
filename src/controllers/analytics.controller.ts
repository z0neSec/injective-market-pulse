/**
 * Analytics Controller
 *
 * Handles /v1/analytics endpoints.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { getOverview, getRankings } from '../services';
import { successResponse } from '../utils/response';

/**
 * GET /v1/analytics/overview
 */
export async function getAnalyticsOverview(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const overview = await getOverview();
  return reply.send(successResponse(overview, '60s'));
}

/**
 * GET /v1/analytics/rankings
 */
export async function getAnalyticsRankings(
  request: FastifyRequest<{
    Querystring: {
      metric?: string;
      type?: string;
      limit?: string;
    };
  }>,
  reply: FastifyReply
) {
  const metric = (request.query.metric || 'volume') as any;
  const type = request.query.type as any;
  const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

  const rankings = await getRankings(metric, type, limit);
  return reply.send(successResponse({ rankings, metric, type: type || 'all' }, '60s'));
}
