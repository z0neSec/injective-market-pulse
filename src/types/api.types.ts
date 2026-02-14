/**
 * Standard API response envelope.
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
  meta: ResponseMeta;
}

export interface ResponseMeta {
  timestamp: string;
  dataFreshness?: string;
  source: string;
  apiVersion: string;
}

/**
 * Pagination parameters.
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Market query filters.
 */
export interface MarketFilters {
  type?: 'spot' | 'derivative';
  status?: string;
  quote?: string;
  search?: string;
  sort?: 'ticker' | 'volume' | 'health';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Rankings query params.
 */
export interface RankingsParams {
  metric: 'volume' | 'liquidity' | 'health' | 'spread' | 'volatility';
  type?: 'spot' | 'derivative';
  limit?: number;
}
