"""The contract's examples, the same table as the web app's tests.

If one implementation changes and the other does not, one of these two
suites fails. That is the point of the fixture.
"""

import pytest

from pricing import basket_total, discounted, subtotal
from pricing.basket import Item

CONTRACT = [
    (1000, 10, 900),
    (1005, 10, 905),
    (333, 33, 223),
    (1, 50, 1),
    (0, 10, 0),
]


@pytest.mark.parametrize(("cents", "percent", "expected"), CONTRACT)
def test_contract_rounding(cents: int, percent: int, expected: int) -> None:
    assert discounted(cents, percent) == expected


def test_rounds_half_up_not_half_to_even() -> None:
    # Python's round() rounds half to even, so round(222.5) is 222 and this
    # would come out a cent low. The contract says half up.
    assert discounted(445, 50) == 223


def test_adds_the_lines() -> None:
    assert subtotal([Item("a", 2, 500), Item("b", 1, 5)]) == 1005


def test_discounts_the_total_not_each_line() -> None:
    assert basket_total([Item("a", 2, 500), Item("b", 1, 5)], 10) == 905


def test_refuses_an_amount_that_is_not_whole_cents() -> None:
    with pytest.raises(TypeError):
        discounted(10.5, 10)  # type: ignore[arg-type]


def test_refuses_a_discount_outside_the_range() -> None:
    with pytest.raises(ValueError):
        discounted(100, 101)
