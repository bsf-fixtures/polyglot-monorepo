import { describe, it, expect } from "vitest";
import { subtotal, discounted, basketTotal } from "../src/basket.js";

/**
 * The examples come from CONTRACT.md. The same table is in the pricing
 * service's tests: if one implementation changes and the other does not,
 * one of these two suites fails.
 */
const CONTRACT: readonly [number, number, number][] = [
  [1000, 10, 900],
  [1005, 10, 905],
  [333, 33, 223],
  [1, 50, 1],
  [0, 10, 0],
];

describe("the contract's rounding table", () => {
  for (const [cents, percent, expected] of CONTRACT) {
    it(`${cents} less ${percent}% is ${expected}`, () => {
      expect(discounted(cents, percent)).toBe(expected);
    });
  }
});

describe("basket arithmetic", () => {
  const items = [
    { sku: "a", quantity: 2, unitPrice: 500 },
    { sku: "b", quantity: 1, unitPrice: 5 },
  ];

  it("adds the lines", () => {
    expect(subtotal(items)).toBe(1005);
  });

  it("discounts the total, not each line", () => {
    // Per line: 1000 - 10% = 900, 5 - 10% = 5 (4.5 rounded up), total 905.
    // On the total: 1005 - 10% = 904.5, rounded up = 905. They agree here,
    // which is why the 333/33% row in the contract is the one that matters.
    expect(basketTotal(items, 10)).toBe(905);
  });

  it("refuses an amount that is not whole cents", () => {
    expect(() => discounted(10.5, 10)).toThrow(TypeError);
  });

  it("refuses a discount outside 0-100", () => {
    expect(() => discounted(100, 101)).toThrow(RangeError);
    expect(() => discounted(100, -1)).toThrow(RangeError);
  });
});
