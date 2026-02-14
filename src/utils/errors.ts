/**
 * Custom API error classes with structured error codes.
 */

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }
}

export class MarketNotFoundError extends ApiError {
  constructor(marketId: string) {
    super(404, 'MARKET_NOT_FOUND', `Market with ID '${marketId}' not found.`);
  }
}

export class InvalidParameterError extends ApiError {
  constructor(param: string, message: string) {
    super(400, 'INVALID_PARAMETER', `Invalid parameter '${param}': ${message}`);
  }
}

export class InjectiveClientError extends ApiError {
  constructor(message: string) {
    super(502, 'UPSTREAM_ERROR', `Injective data source error: ${message}`);
  }
}

export class RateLimitError extends ApiError {
  constructor() {
    super(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.');
  }
}
