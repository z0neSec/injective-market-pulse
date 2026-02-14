import { ApiResponse, ResponseMeta } from '../types/api.types';
import { config } from '../config';

/**
 * Create a standard success response envelope.
 */
export function successResponse<T>(data: T, freshness?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: buildMeta(freshness),
  };
}

/**
 * Build response metadata.
 */
function buildMeta(freshness?: string): ResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    ...(freshness ? { dataFreshness: freshness } : {}),
    source: `injective-${config.injective.network}`,
    apiVersion: 'v1',
  };
}
