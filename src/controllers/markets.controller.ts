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

  const result = await getFilteredMarkets({
    type: type as any,
    quote,
    search,
    limit: limit ? parseInt(limit, 10) : 50,
    offset: offset ? parseInt(offset, 10) : 0,
  });

  return reply.send(
    successResponse(
      { markets: result.markets, total: result.total },
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
  const { marketId } = request.params;
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
  const summary = await getMarketSummary(request.params.marketId);
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
  const depth = request.query.depth ? parseInt(request.query.depth, 10) : 25;
  const ob = await getOrderbook(request.params.marketId, depth);
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
  const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;
  const stats = await getTradeStats(request.params.marketId, limit);
  return reply.send(successResponse(stats, '10s'));
}

/**
 * GET /v1/markets/:marketId/health
 */
export async function getMarketHealthHandler(
  request: FastifyRequest<{ Params: { marketId: string } }>,
  reply: FastifyReply
) {
  const health = await getMarketHealth(request.params.marketId);
  return reply.send(successResponse(health, '30s'));
}
