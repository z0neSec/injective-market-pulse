/**
 * Markets Controller
 *
 * Handles all /v1/markets endpoints.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import {
  getFilteredMarkets,
  getSpotMarkets,
  getDerivativeMarkets,
  getMarketById,
  getOrderbook,
  getTradeStats,
  getMarketHealth,
  getMarketSummary,
} from '../services';
import { successResponse } from '../utils/response';
import { MarketNotFoundError } from '../utils/errors';
import { parseIntParam, parseEnumParam, validateMarketId } from '../utils/validation';

/**
 * GET /v1/markets
 */
export async function listMarkets(
  request: FastifyRequest<{
    Querystring: {
      type?: string;
      quote?: string;
      search?: string;
      limit?: string;
      offset?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { type, quote, search, limit, offset } = request.query;

  const validType = parseEnumParam(type, 'type', ['spot', 'derivative'] as const);
  const validLimit = parseIntParam(limit, 'limit', { default: 50, min: 1, max: 100 });
  const validOffset = parseIntParam(offset, 'offset', { default: 0, min: 0, max: 10000 });

  const result = await getFilteredMarkets({
    type: validType,
    quote,
    search,
    limit: validLimit,
    offset: validOffset,
  });

  return reply.send(
    successResponse(
      {
        markets: result.markets,
        total: result.total,
        pagination: {
          limit: validLimit,
          offset: validOffset,
          hasMore: validOffset + validLimit < result.total,
        },
      },
      '60s'
    )
  );
}

/**
 * GET /v1/markets/spot
 */
export async function listSpotMarkets(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const markets = await getSpotMarkets();
  return reply.send(successResponse({ markets, total: markets.length }, '60s'));
}

/**
 * GET /v1/markets/derivative
 */
export async function listDerivativeMarkets(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const markets = await getDerivativeMarkets();
  return reply.send(successResponse({ markets, total: markets.length }, '60s'));
}

/**
 * GET /v1/markets/:marketId
 */
export async function getMarket(
  request: FastifyRequest<{ Params: { marketId: string } }>,
  reply: FastifyReply
) {
  const marketId = validateMarketId(request.params.marketId);
  const market = await getMarketById(marketId);
  if (!market) throw new MarketNotFoundError(marketId);
  return reply.send(successResponse(market, '60s'));
}

/**
 * GET /v1/markets/:marketId/summary
 */
export async function getMarketSummaryHandler(
  request: FastifyRequest<{ Params: { marketId: string } }>,
  reply: FastifyReply
) {
  const marketId = validateMarketId(request.params.marketId);
  const summary = await getMarketSummary(marketId);
  return reply.send(successResponse(summary, '30s'));
}

/**
 * GET /v1/markets/:marketId/orderbook
 */
export async function getMarketOrderbook(
  request: FastifyRequest<{
    Params: { marketId: string };
    Querystring: { depth?: string };
  }>,
  reply: FastifyReply
) {
  const marketId = validateMarketId(request.params.marketId);
  const depth = parseIntParam(request.query.depth, 'depth', { default: 25, min: 1, max: 50 });
  const ob = await getOrderbook(marketId, depth);
  return reply.send(successResponse(ob, '10s'));
}

/**
 * GET /v1/markets/:marketId/trades
 */
export async function getMarketTrades(
  request: FastifyRequest<{
    Params: { marketId: string };
    Querystring: { limit?: string };
  }>,
  reply: FastifyReply
) {
  const marketId = validateMarketId(request.params.marketId);
  const limit = parseIntParam(request.query.limit, 'limit', { default: 50, min: 1, max: 100 });
  const stats = await getTradeStats(marketId, limit);
  return reply.send(successResponse(stats, '10s'));
}

/**
 * GET /v1/markets/:marketId/health
 */
export async function getMarketHealthHandler(
  request: FastifyRequest<{ Params: { marketId: string } }>,
  reply: FastifyReply
) {
  const marketId = validateMarketId(request.params.marketId);
  const health = await getMarketHealth(marketId);
  return reply.send(successResponse(health, '30s'));
}
