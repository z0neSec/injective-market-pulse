/**
 * Unit tests for input validation utilities.
 *
 * Validates parameter parsing, bounds checking, and error throwing.
 */

import { describe, it, expect } from 'vitest';
import { parseIntParam, parseEnumParam, validateMarketId } from '../src/utils/validation';

describe('parseIntParam', () => {
  const opts = { default: 50, min: 1, max: 100 };

  it('should return default for undefined or empty', () => {
    expect(parseIntParam(undefined, 'limit', opts)).toBe(50);
    expect(parseIntParam('', 'limit', opts)).toBe(50);
  });

  it('should parse valid integers', () => {
    expect(parseIntParam('25', 'limit', opts)).toBe(25);
    expect(parseIntParam('1', 'limit', opts)).toBe(1);
    expect(parseIntParam('100', 'limit', opts)).toBe(100);
  });

  it('should throw for non-numeric values', () => {
    expect(() => parseIntParam('abc', 'limit', opts)).toThrow('must be a valid integer');
  });

  it('should throw for out-of-range values', () => {
    expect(() => parseIntParam('0', 'limit', opts)).toThrow('must be between');
    expect(() => parseIntParam('101', 'limit', opts)).toThrow('must be between');
    expect(() => parseIntParam('-5', 'limit', opts)).toThrow('must be between');
  });
});

describe('parseEnumParam', () => {
  const allowed = ['spot', 'derivative'] as const;

  it('should return undefined for undefined/empty', () => {
    expect(parseEnumParam(undefined, 'type', allowed)).toBeUndefined();
    expect(parseEnumParam('', 'type', allowed)).toBeUndefined();
  });

  it('should return defaultValue when provided and input is empty', () => {
    expect(parseEnumParam(undefined, 'type', allowed, 'spot')).toBe('spot');
  });

  it('should accept valid enum values', () => {
    expect(parseEnumParam('spot', 'type', allowed)).toBe('spot');
    expect(parseEnumParam('derivative', 'type', allowed)).toBe('derivative');
  });

  it('should throw for invalid enum values', () => {
    expect(() => parseEnumParam('futures', 'type', allowed)).toThrow('must be one of');
  });
});

describe('validateMarketId', () => {
  it('should accept valid market IDs', () => {
    const id = '0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef654b12ca7e6031ca0fa';
    expect(validateMarketId(id)).toBe(id);
  });

  it('should reject empty strings', () => {
    expect(() => validateMarketId('')).toThrow('must be a valid 0x-prefixed');
  });

  it('should reject non-0x strings', () => {
    expect(() => validateMarketId('abc123')).toThrow('must be a valid 0x-prefixed');
  });

  it('should reject too-short 0x strings', () => {
    expect(() => validateMarketId('0x123')).toThrow('must be a valid 0x-prefixed');
  });
});
