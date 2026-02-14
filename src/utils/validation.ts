/**
 * Input Validation Utilities
 *
 * Centralized parameter validation with safe defaults and bounds checking.
 * Prevents invalid inputs from reaching services.
 */

import { InvalidParameterError } from './errors';

/**
 * Parse and validate an integer query parameter within bounds.
 */
export function parseIntParam(
  value: string | undefined,
  name: string,
  options: { default: number; min: number; max: number }
): number {
  if (value === undefined || value === '') return options.default;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new InvalidParameterError(name, `must be a valid integer, got '${value}'`);
  }
  if (parsed < options.min || parsed > options.max) {
    throw new InvalidParameterError(
      name,
      `must be between ${options.min} and ${options.max}, got ${parsed}`
    );
  }
  return parsed;
}

/**
 * Validate that a string is one of the allowed values.
 */
export function parseEnumParam<T extends string>(
  value: string | undefined,
  name: string,
  allowed: readonly T[],
  defaultValue?: T
): T | undefined {
  if (value === undefined || value === '') return defaultValue;
  if (!allowed.includes(value as T)) {
    throw new InvalidParameterError(
      name,
      `must be one of [${allowed.join(', ')}], got '${value}'`
    );
  }
  return value as T;
}

/**
 * Validate a market ID format (0x-prefixed hex string).
 */
export function validateMarketId(marketId: string): string {
  if (!marketId || !marketId.startsWith('0x') || marketId.length < 10) {
    throw new InvalidParameterError(
      'marketId',
      `must be a valid 0x-prefixed hex string, got '${marketId}'`
    );
  }
  return marketId;
}
