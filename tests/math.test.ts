/**
 * Unit tests for mathematical utility functions.
 *
 * These are pure functions with no external dependencies — easy to test
 * and critical to data correctness.
 */

import { describe, it, expect } from 'vitest';
import { standardDeviation, realizedVolatility, relativeSpreadBps, depthImbalance, clamp, scoreToGrade } from '../src/utils/math';

describe('standardDeviation', () => {
  it('should return 0 for fewer than 2 values', () => {
    expect(standardDeviation([])).toBe(0);
    expect(standardDeviation([5])).toBe(0);
  });

  it('should return 0 for identical values', () => {
    expect(standardDeviation([5, 5, 5, 5])).toBe(0);
  });

  it('should compute correct standard deviation', () => {
    const result = standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result).toBeCloseTo(2.138, 2);
  });
});

describe('realizedVolatility', () => {
  it('should return 0 for fewer than 3 prices', () => {
    expect(realizedVolatility([])).toBe(0);
    expect(realizedVolatility([100])).toBe(0);
    expect(realizedVolatility([100, 101])).toBe(0);
  });

  it('should return 0 for constant prices', () => {
    expect(realizedVolatility([100, 100, 100, 100])).toBe(0);
  });

  it('should be positive for varying prices', () => {
    const vol = realizedVolatility([100, 102, 98, 103, 99]);
    expect(vol).toBeGreaterThan(0);
  });

  it('should be higher for more volatile prices', () => {
    const low = realizedVolatility([100, 100.5, 100, 100.5, 100]);
    const high = realizedVolatility([100, 110, 90, 110, 90]);
    expect(high).toBeGreaterThan(low);
  });
});

describe('relativeSpreadBps', () => {
  it('should return 0 for invalid inputs', () => {
    expect(relativeSpreadBps(0, 100)).toBe(0);
    expect(relativeSpreadBps(100, 0)).toBe(0);
    expect(relativeSpreadBps(-1, 100)).toBe(0);
  });

  it('should compute correct spread in basis points', () => {
    // Mid = 100, spread = 1, so 1/100 * 10000 = 100 bps
    const result = relativeSpreadBps(99.5, 100.5);
    expect(result).toBeCloseTo(100, 0);
  });

  it('should return 0 for zero spread', () => {
    expect(relativeSpreadBps(100, 100)).toBe(0);
  });
});

describe('depthImbalance', () => {
  it('should return 0 for equal depth', () => {
    expect(depthImbalance(1000, 1000)).toBe(0);
  });

  it('should return 0 for zero depth', () => {
    expect(depthImbalance(0, 0)).toBe(0);
  });

  it('should return 1 for completely one-sided', () => {
    expect(depthImbalance(1000, 0)).toBe(1);
    expect(depthImbalance(0, 1000)).toBe(1);
  });

  it('should return a value between 0 and 1', () => {
    const result = depthImbalance(800, 1200);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
    expect(result).toBeCloseTo(0.2, 2);
  });
});

describe('clamp', () => {
  it('should clamp value below min', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it('should clamp value above max', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('should not clamp value within range', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });
});

describe('scoreToGrade', () => {
  it('should map scores to correct grades', () => {
    expect(scoreToGrade(95)).toBe('A+');
    expect(scoreToGrade(90)).toBe('A+');
    expect(scoreToGrade(85)).toBe('A');
    expect(scoreToGrade(80)).toBe('A');
    expect(scoreToGrade(75)).toBe('B');
    expect(scoreToGrade(65)).toBe('C');
    expect(scoreToGrade(55)).toBe('D');
    expect(scoreToGrade(40)).toBe('F');
    expect(scoreToGrade(0)).toBe('F');
  });
});
