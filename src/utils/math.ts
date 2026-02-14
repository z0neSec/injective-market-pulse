/**
 * Mathematical utilities for computing market metrics.
 */

/**
 * Calculate the standard deviation of an array of numbers.
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1);
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate realized volatility from a series of prices using log returns.
 */
export function realizedVolatility(prices: number[]): number {
  if (prices.length < 3) return 0;

  const logReturns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0 && prices[i] > 0) {
      logReturns.push(Math.log(prices[i] / prices[i - 1]));
    }
  }

  if (logReturns.length < 2) return 0;
  return standardDeviation(logReturns);
}

/**
 * Calculate the relative spread in basis points.
 */
export function relativeSpreadBps(bestBid: number, bestAsk: number): number {
  if (bestBid <= 0 || bestAsk <= 0) return 0;
  const midPrice = (bestBid + bestAsk) / 2;
  if (midPrice === 0) return 0;
  return ((bestAsk - bestBid) / midPrice) * 10000;
}

/**
 * Calculate depth imbalance: 0 = perfectly balanced, 1 = completely one-sided.
 */
export function depthImbalance(bidDepth: number, askDepth: number): number {
  const total = bidDepth + askDepth;
  if (total === 0) return 0;
  return Math.abs(bidDepth - askDepth) / total;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert a score (0-100) to a letter grade.
 */
export function scoreToGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
