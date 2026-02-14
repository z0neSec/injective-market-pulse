/**
 * Unit tests for decimal conversion utilities.
 *
 * Ensures chain-format ↔ human-readable conversions are correct —
 * a single bug here would corrupt ALL price/quantity data in the API.
 */

import { describe, it, expect } from 'vitest';
import {
  fromChainAmount,
  spotPriceToHuman,
  spotQuantityToHuman,
  derivativePriceToHuman,
  derivativeQuantityToHuman,
  toFixedSafe,
} from '../src/utils/decimals';

describe('fromChainAmount', () => {
  it('should return 0 for empty or zero values', () => {
    expect(fromChainAmount('', 18)).toBe(0);
    expect(fromChainAmount('0', 18)).toBe(0);
  });

  it('should return 0 for non-numeric strings', () => {
    expect(fromChainAmount('abc', 18)).toBe(0);
  });

  it('should correctly divide by 10^decimals', () => {
    expect(fromChainAmount('1000000000000000000', 18)).toBe(1);
    expect(fromChainAmount('1000000', 6)).toBe(1);
    expect(fromChainAmount('500000', 6)).toBe(0.5);
  });
});

describe('spotPriceToHuman', () => {
  it('should apply base-quote decimal conversion', () => {
    // INJ (18 decimals) / USDT (6 decimals) — chainPrice * 10^(18-6) = price * 10^12
    const result = spotPriceToHuman('0.000000000001', 18, 6);
    expect(result).toBeCloseTo(1, 6);
  });

  it('should return 0 for invalid price', () => {
    expect(spotPriceToHuman('', 18, 6)).toBe(0);
    expect(spotPriceToHuman('abc', 18, 6)).toBe(0);
  });
});

describe('spotQuantityToHuman', () => {
  it('should divide by 10^baseDecimals', () => {
    expect(spotQuantityToHuman('1000000000000000000', 18)).toBe(1);
    expect(spotQuantityToHuman('5000000', 6)).toBe(5);
  });

  it('should return 0 for invalid quantity', () => {
    expect(spotQuantityToHuman('', 18)).toBe(0);
  });
});

describe('derivativePriceToHuman', () => {
  it('should divide by 10^quoteDecimals', () => {
    expect(derivativePriceToHuman('50000000000', 6)).toBe(50000);
    expect(derivativePriceToHuman('1000000', 6)).toBe(1);
  });

  it('should return 0 for invalid inputs', () => {
    expect(derivativePriceToHuman('', 6)).toBe(0);
  });
});

describe('derivativeQuantityToHuman', () => {
  it('should return the raw number (no decimal shift)', () => {
    expect(derivativeQuantityToHuman('10.5')).toBe(10.5);
  });

  it('should return 0 for invalid inputs', () => {
    expect(derivativeQuantityToHuman('')).toBe(0);
  });
});

describe('toFixedSafe', () => {
  it('should round to specified decimal places', () => {
    expect(toFixedSafe(1.23456789, 4)).toBe(1.2346);
    expect(toFixedSafe(1.23456789, 2)).toBe(1.23);
  });

  it('should default to 6 decimal places', () => {
    expect(toFixedSafe(1.123456789)).toBe(1.123457);
  });

  it('should handle whole numbers', () => {
    expect(toFixedSafe(100, 2)).toBe(100);
  });
});
