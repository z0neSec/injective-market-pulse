/**
 * Analytics Controller
 *
 * Handles /v1/analytics endpoints.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { getOverview, getRankings, compareMarkets } from '../services';
import { successResponse } from '../utils/response';
import { parseIntParam, parseEnumParam } from '../utils/validation';

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
  const metric = parseEnumParam(
    request.query.metric,
    'metric',
    ['volume', 'liquidity', 'health', 'spread', 'volatility'] as const,
    'volume'
  )!;
  const type = parseEnumParam(
    request.query.type,
    'type',
    ['spot', 'derivative'] as const
  );
  const limit = parseIntParam(request.query.limit, 'limit', { default: 10, min: 1, max: 50 });

  const rankings = await getRankings(metric, type, limit);
  return reply.send(successResponse({ rankings, metric, type: type || 'all' }, '60s'));
}

/**
 * GET /v1/analytics/compare?markets=id1,id2,...
 */
export async function getMarketComparison(
  request: FastifyRequest<{
    Querystring: { markets?: string };
  }>,
  reply: FastifyReply
) {
  const marketsParam = request.query.markets || '';
  const marketIds = marketsParam
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  const comparison = await compareMarkets(marketIds);
  return reply.send(successResponse(comparison, '30s'));
}
