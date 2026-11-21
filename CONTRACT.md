# The contract between the two apps

One rule, stated once, implemented twice. Both implementations are tested
against the examples below, so a change to one of them that does not change
the other fails.

## Money

Amounts are **integer cents**. Never a float, in either language.

## Discount rounding

A percentage discount is applied to the basket total, not line by line, and
rounds **half up**.

| Basket (cents) | Discount | Expected (cents) |
| --- | --- | --- |
| 1000 | 10% | 900 |
| 1005 | 10% | 905 |
| 333 | 33% | 223 |
| 1 | 50% | 1 |
| 0 | 10% | 0 |

The third row is the one that matters: 333 less 33% is 223.11, and rounding
half up on the *total* gives 223. Applying the discount per line and adding
up gives a different number.
