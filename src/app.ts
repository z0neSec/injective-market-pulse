/**
 * Fastify Application Setup
 *
 * Configures CORS, rate limiting, Swagger docs, error handling,
 * and registers all routes.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config';
import { registerRoutes } from './routes';
import { ApiError } from './utils/errors';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  });

  // ── CORS ──────────────────────────────────────
  await app.register(cors, { origin: true });

  // ── Rate Limiting ─────────────────────────────
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        statusCode: 429,
      },
      meta: {
        timestamp: new Date().toISOString(),
        source: `injective-${config.injective.network}`,
        apiVersion: 'v1',
      },
    }),
  });

  // ── Swagger / OpenAPI ─────────────────────────
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Injective Market Pulse API',
        description:
          'Infrastructure-grade REST API that transforms raw Injective on-chain data into actionable market intelligence — liquidity depth, volatility, spread analysis, and health scores.',
        version: '1.0.0',
        contact: {
          name: 'Injective Market Pulse',
          url: 'https://github.com/yourusername/injective-market-pulse',
        },
      },
      servers: [
        { url: `http://localhost:${config.server.port}`, description: 'Local' },
      ],
      tags: [
        { name: 'Markets', description: 'Market discovery and details' },
        { name: 'Market Intelligence', description: 'Orderbook, trades, and health metrics' },
        { name: 'Analytics', description: 'Cross-market analytics and rankings' },
        { name: 'System', description: 'API status and health' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // ── Global Error Handler ──────────────────────
  app.setErrorHandler((error: any, _request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        },
        meta: {
          timestamp: new Date().toISOString(),
          source: `injective-${config.injective.network}`,
          apiVersion: 'v1',
        },
      });
    }

    // Fastify validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          statusCode: 400,
        },
        meta: {
          timestamp: new Date().toISOString(),
          source: `injective-${config.injective.network}`,
          apiVersion: 'v1',
        },
      });
    }

    // Rate limit errors from @fastify/rate-limit
    if (error.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          statusCode: 429,
        },
        meta: {
          timestamp: new Date().toISOString(),
          source: `injective-${config.injective.network}`,
          apiVersion: 'v1',
        },
      });
    }

    // Unexpected errors
    app.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        statusCode: 500,
      },
      meta: {
        timestamp: new Date().toISOString(),
        source: `injective-${config.injective.network}`,
        apiVersion: 'v1',
      },
    });
  });

  // ── 404 Handler ───────────────────────────────
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist.',
        statusCode: 404,
      },
      meta: {
        timestamp: new Date().toISOString(),
        source: `injective-${config.injective.network}`,
        apiVersion: 'v1',
      },
    });
  });

  // ── Routes ────────────────────────────────────
  await registerRoutes(app);

  // ── Root redirect to docs ─────────────────────
  app.get('/', async (_request, reply) => {
    reply.redirect('/docs');
  });

  return app;
}
