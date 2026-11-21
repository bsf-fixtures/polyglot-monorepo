/**
 * The cart's half of the contract in CONTRACT.md.
 *
 * Integer cents throughout, and the discount applies to the basket total
 * rather than line by line — applying it per line and adding up gives a
 * different number, and the total is what the customer checks.
 */

export interface Item {
  readonly sku: string;
  readonly quantity: number;
  /** Unit price in cents. */
  readonly unitPrice: number;
}

export function subtotal(items: readonly Item[]): number {
  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
}

/**
 * Apply a whole-percentage discount, rounding half up.
 *
 * `Math.round` rounds half up for positive numbers, which is what the
 * contract asks for; it rounds half *away from zero* for negatives, and a
 * basket cannot be negative, so the two agree here.
 */
export function discounted(cents: number, percent: number): number {
  if (!Number.isInteger(cents)) throw new TypeError("an amount must be whole cents");
  if (percent < 0 || percent > 100) throw new RangeError("a discount is between 0 and 100 percent");
  return Math.round((cents * (100 - percent)) / 100);
}

export function basketTotal(items: readonly Item[], percent = 0): number {
  return discounted(subtotal(items), percent);
}
