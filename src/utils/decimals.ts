/**
 * Decimal conversion utilities for Injective chain-format ↔ human-readable.
 *
 * Injective stores prices and quantities in chain format with decimal exponents.
 * Spot price chain → human: value × 10^(baseDecimals - quoteDecimals)
 * Derivative price chain → human: value × 10^quoteDecimals
 */

/**
 * Convert a chain-format string number to human-readable, given a decimal shift.
 */
export function fromChainAmount(value: string, decimals: number): number {
  if (!value || value === '0') return 0;
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return num / Math.pow(10, decimals);
}

/**
 * Convert a spot price from chain format to human readable.
 * Formula: chainPrice × 10^(baseDecimals - quoteDecimals)
 */
export function spotPriceToHuman(
  chainPrice: string,
  baseDecimals: number,
  quoteDecimals: number
): number {
  const price = parseFloat(chainPrice);
  if (isNaN(price)) return 0;
  return price * Math.pow(10, baseDecimals - quoteDecimals);
}

/**
 * Convert a spot quantity from chain format to human readable.
 * Formula: chainQuantity × 10^(-baseDecimals)
 */
export function spotQuantityToHuman(chainQuantity: string, baseDecimals: number): number {
  const qty = parseFloat(chainQuantity);
  if (isNaN(qty)) return 0;
  return qty / Math.pow(10, baseDecimals);
}

/**
 * Convert a derivative price from chain format to human readable.
 * Formula: chainPrice × 10^(-quoteDecimals)
 */
export function derivativePriceToHuman(chainPrice: string, quoteDecimals: number): number {
  const price = parseFloat(chainPrice);
  if (isNaN(price)) return 0;
  return price / Math.pow(10, quoteDecimals);
}

/**
 * Convert a derivative quantity from chain format to human readable.
 */
export function derivativeQuantityToHuman(chainQuantity: string): number {
  const qty = parseFloat(chainQuantity);
  if (isNaN(qty)) return 0;
  return qty;
}

/**
 * Format a number to a sensible precision.
 */
export function toFixedSafe(value: number, decimals: number = 6): number {
  return parseFloat(value.toFixed(decimals));
}
