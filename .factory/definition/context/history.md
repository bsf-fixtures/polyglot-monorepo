<!--
  What has gone wrong before, and what was learned. Seeded by setup from the
  mined corrections, then added to by the scheduled review.

  This file is for failures whose lesson could not be turned into a check. A
  correction that became a rule does not belong here: the rule is the record,
  and repeating it in prose means two things to keep in step.
-->

# History — polyglot-monorepo

**There is no history to mine yet.** `git log` holds exactly one commit —
`7ebf819`, a squashed import of the whole repository — so there are no
corrections, no reverts, no fix-up commits and no review threads to learn
from. `.factory/guardrails/candidates.json` is empty, `baselines.json` has no
rules recorded, and the factory has not completed a run here.

The tables below are therefore empty on purpose. An empty row is the honest
answer; inventing a plausible past incident would be worse than having none,
because these tables are read as evidence.

Two lessons *are* visible in the code without having happened in this
repository's history, and they are recorded in `fundamentals.md` rather than
here, because they came from reading the source rather than from a failure the
factory can point at: Python's built-in `round` is half-to-even and silently
produces a cent-low total, and `bool` is a subclass of `int` so a boolean
passes an `isinstance(x, int)` guard. Both are already defended against in
`services/pricing/pricing/basket.py`, with a comment explaining why.

## Lessons

| What happened | What to do instead | Where it came from |
| --- | --- | --- |
| *(none recorded)* | | |

## Problem classes already eliminated

Kept so nobody proposes a rule that exists, and so a regression is
recognisable as one.

| Problem class | How it was eliminated | When |
| --- | --- | --- |
| *(none recorded by the factory)* | | |

Worth knowing before proposing a rule, though none of these was *eliminated*
by the factory — they are how the repository arrived:

- **Floating-point money** is prevented by the contract and by both type
  signatures (`int` / integer-valued `number`), and `discounted` throws on a
  non-integer amount in both languages. A rule proposing "no floats in money
  paths" would be restating what the guards already enforce.
- **Rounding drift between the two languages** is caught by the five
  `CONTRACT.md` rows being duplicated into both suites. Verified during setup:
  truncating instead of rounding half up in
  `services/pricing/pricing/basket.py` failed 4 pytest tests and 0 vitest
  tests. The gap this does *not* close is a change to the table in one suite
  and not the other — see the warning in `fundamentals.md`.
- **Lint and type drift** are covered by the repo's own tools, which the
  sandbox's build command runs: `tsc --noEmit` under `strict` and
  `noUncheckedIndexedAccess`, `eslint` with `typescript-eslint` recommended,
  and `ruff` with the `E, F, B, SIM, RET, ARG` selection.

## Escalations

Work the factory could not finish, and why. A pattern across several of these
is a signal about the factory rather than about the work.

| Work item | Where it stopped | Cause |
| --- | --- | --- |
| *(none — the factory has not run here yet)* | | |

One thing is known in advance to be out of the sandbox's reach, recorded here
so the first escalation that hits it is recognised rather than debugged:
**diff coverage cannot be measured**. `.factory/guardrails/coverage.json` asks
for 80%, and neither package has a coverage provider installed — no
`@vitest/coverage-v8`, no `pytest-cov`. This is in the sandbox manifest's
`not_exercised` as well.
