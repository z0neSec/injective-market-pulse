/**
 * Unit tests for API response helpers and error classes.
 */

import { describe, it, expect } from 'vitest';
import { successResponse } from '../src/utils/response';
import { ApiError, MarketNotFoundError, InvalidParameterError, InjectiveClientError, RateLimitError } from '../src/utils/errors';

describe('successResponse', () => {
  it('should wrap data in standard envelope', () => {
    const result = successResponse({ foo: 'bar' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ foo: 'bar' });
    expect(result.meta).toBeDefined();
    expect(result.meta.apiVersion).toBe('v1');
    expect(result.meta.source).toMatch(/^injective-/);
    expect(result.meta.timestamp).toBeDefined();
  });

  it('should include dataFreshness when provided', () => {
    const result = successResponse({}, '30s');
    expect(result.meta.dataFreshness).toBe('30s');
  });

  it('should omit dataFreshness when not provided', () => {
    const result = successResponse({});
    expect(result.meta.dataFreshness).toBeUndefined();
  });
});

describe('Error Classes', () => {
  it('ApiError should have correct properties', () => {
    const err = new ApiError(400, 'TEST_ERROR', 'test message');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('TEST_ERROR');
    expect(err.message).toBe('test message');
    expect(err).toBeInstanceOf(Error);
  });

  it('MarketNotFoundError should be 404', () => {
    const err = new MarketNotFoundError('0xabc123def4');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('MARKET_NOT_FOUND');
    expect(err.message).toContain('0xabc123def4');
  });

  it('InvalidParameterError should be 400', () => {
    const err = new InvalidParameterError('limit', 'must be positive');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('INVALID_PARAMETER');
    expect(err.message).toContain('limit');
  });

  it('InjectiveClientError should be 502', () => {
    const err = new InjectiveClientError('timeout');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('UPSTREAM_ERROR');
  });

  it('RateLimitError should be 429', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
