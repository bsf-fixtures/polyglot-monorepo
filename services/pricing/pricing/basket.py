"""Basket arithmetic in integer cents.

The other half of CONTRACT.md. Integer cents throughout, and the discount
applies to the basket total rather than line by line — applying it per line
and adding up gives a different number, and the total is what the customer
checks.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal


@dataclass(frozen=True)
class Item:
    """One line of a basket. Unit price in cents."""

    sku: str
    quantity: int
    unit_price: int


def subtotal(items: list[Item]) -> int:
    return sum(item.unit_price * item.quantity for item in items)


def discounted(cents: int, percent: int) -> int:
    """Apply a whole-percentage discount, rounding half up.

    Decimal with ROUND_HALF_UP rather than ``round()``: Python's built-in
    rounds half to *even*, so ``round(222.5)`` is 222 and the contract's
    333-less-33% row would come out one cent low.
    """
    if not isinstance(cents, int) or isinstance(cents, bool):
        raise TypeError("an amount must be whole cents")
    if not 0 <= percent <= 100:
        raise ValueError("a discount is between 0 and 100 percent")

    exact = Decimal(cents) * Decimal(100 - percent) / Decimal(100)
    return int(exact.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def basket_total(items: list[Item], percent: int = 0) -> int:
    return discounted(subtotal(items), percent)
