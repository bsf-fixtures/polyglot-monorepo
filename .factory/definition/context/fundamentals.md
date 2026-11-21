<!--
  The conventions no check enforces. Everything here is something a script
  could not decide, which is why it is prose.

  The bar for a line in this file: it has to be a judgement. If a static rule
  could catch it, it belongs in .factory/guardrails/ instead, because a rule
  is reproducible and prose is something agents argue with.

  Each line carries where it came from, so a line nobody can justify can be
  removed later.
-->

# Fundamentals — polyglot-monorepo

## Dominant patterns

For each recurring concern, the pattern most of this codebase already uses.
Follow it rather than introducing a second way of doing the same thing.

| Concern | The pattern here | Source |
| --- | --- | --- |
| Money | **Integer cents, never a float.** `number` typed as cents in TypeScript, `int` in Python. No currency type, no `Decimal` in the public signatures, no formatting helpers — the libraries deal in integers and leave display to a caller that does not exist yet. | `CONTRACT.md` ("Amounts are **integer cents**. Never a float, in either language."); `unitPrice: number` in `apps/web/src/basket.ts`, `unit_price: int` in `services/pricing/pricing/basket.py` |
| Rounding | **Half up, applied to the basket total, never line by line.** TypeScript uses `Math.round`, which is half-up for positives. Python must *not* use the built-in `round`, which is half-to-even — it uses `Decimal(...).quantize(Decimal("1"), rounding=ROUND_HALF_UP)`. The two languages reach the same answer by different means, and each file carries a comment saying why its own means is the right one. | `CONTRACT.md`; the docstring of `discounted` in both files |
| Where a rule lives | **Stated once in prose, implemented twice, tested twice against the same table.** The five rows of the contract table appear as a literal `CONTRACT` constant at the top of *both* test files, in the same order. | `apps/web/test/basket.test.ts`, `services/pricing/tests/test_basket.py` |
| Input validation | **Guard at the entry point and throw; never coerce, never clamp, never return a sentinel.** `discounted` checks wholeness and range before doing any arithmetic. The two languages map the two failures onto their own idioms: wrong *type* is `TypeError` in both; wrong *value* is `RangeError` in TypeScript and `ValueError` in Python. | `discounted` in both files; `test_refuses_*` and the `refuses ...` cases in both suites |
| Immutability | **Inputs are not mutated and are typed as unmodifiable.** `readonly` on every field of `Item` and on the array parameter in TypeScript; `@dataclass(frozen=True)` in Python. | `apps/web/src/basket.ts`, `services/pricing/pricing/basket.py` |
| Composition | **Small named functions that build on one another**, not one function with flags: `subtotal` adds the lines, `discounted` applies the percentage, `basketTotal`/`basket_total` is the composition of the two and holds no arithmetic of its own. | Both implementations |
| Python typing | `from __future__ import annotations` at the top, built-in generics (`list[Item]`) rather than `typing.List`, and a return annotation on every function. | `services/pricing/pricing/basket.py` |
| Module surface | **`__init__.py` re-exports and declares `__all__`;** tests import from the package root (`from pricing import ...`) except where they need a type, which comes from the module (`from pricing.basket import Item`). | `services/pricing/pricing/__init__.py` |
| Comments | **Comments explain the choice, not the mechanics.** Every comment in this repo answers "why this and not the obvious alternative" — why `Math.round` is acceptable here, why `Decimal` instead of `round()`, why the `333`/`33%` row is the one that matters. There are no comments restating what the next line does. | Every file in `apps/`, `services/` and `CONTRACT.md` |
| Dependencies | **Almost none.** `apps/web` has zero runtime dependencies and five dev tools; `services/pricing` declares an empty `dependencies` list and uses only the standard library. Adding a runtime dependency to either package would be the first one. | `apps/web/package.json`, `services/pricing/pyproject.toml` |
| Test style | Table-driven for the contract rows — `for...of` generating a named `it` per row in vitest, `@pytest.mark.parametrize` in pytest — then separate named tests for the behaviours around it. Test names are sentences describing the behaviour (`"discounts the total, not each line"`, `test_rounds_half_up_not_half_to_even`). | Both suites |

## Product intent

This is a **fixture for the Build Software Factory**, not a product. `README.md`
says so outright: it exists "for the thing a single-language fixture cannot
test — one factory covering two apps". Nobody checks out this basket code
to sell anything.

That changes two decisions an agent has to make here.

**The polyglot structure is the point, so do not consolidate it.** The obvious
"improvement" — pick one language, delete the duplicate — destroys the only
reason the repository exists. Likewise, `.github/workflows/ci.yml` splits into
two path-filtered jobs on purpose, so that a PR touching only `apps/web` does
not run the Python suite; that is a behaviour under test, not an
inefficiency. The duplication between `basket.ts` and `basket.py` is
deliberate and permanent.

**The contract is the product.** What this repository asserts is that one rule
written down once stays true in two implementations. Work that keeps the two
in step, or makes a divergence louder, is on-intent. Work that adds basket
features neither side needs is not — there is no customer asking for them,
and every feature added in one language is a feature that must be added in
the other or the contract quietly weakens.

A consequence worth stating: **`README.md` describes a relationship the code
does not have.** It says "the web app asks the service what a basket costs",
and nothing implements that — no HTTP client, no endpoint. Treat the prose as
intent, not as a description of today, and do not write code that assumes the
call exists.

## Taste

Things a reviewer would ask for that no rule states.

- **If you change the rounding rule, change three files.** `CONTRACT.md`,
  `apps/web/test/basket.test.ts` and `services/pricing/tests/test_basket.py`
  hold the same five rows. A change to the rule in one implementation without
  the other fails a suite and you will notice. A change to the *table* in one
  suite and not the other leaves the two apps disagreeing with every test
  green — the one way this repository can go quietly wrong. Edit the contract
  first, then both suites, then both implementations.
- **Keep `CONTRACT.md` the source and the code the copy.** When they disagree,
  the contract is right and the code is the bug. Do not update the contract to
  match what the code happens to do.
- **Never introduce a float into a money path, in either language,** even
  transiently and even where it would round correctly for the five rows in the
  table. `Decimal` in Python is a deliberate escape from binary floating point,
  not a stylistic preference, and the TypeScript side stays in integers because
  the arithmetic is small enough to be exact. "It passes the tests" is not the
  bar; the bar is that no intermediate value is ever a float.
- **A new contract row goes into both suites in the same change,** in the same
  position, with the same values. Adding it to one is worse than adding it to
  neither, because it looks like coverage.
- **Prefer a new example row over a new assertion style.** The suites are
  table-driven for a reason: a row is a fact from `CONTRACT.md` that both
  languages can check identically, and it reads as the same test in both.
- **Run both suites even when the change touches one language.** CI will not,
  by design. Verification should. See the runbook.
- **Say why in a comment, or say nothing.** Matching the existing comment
  style matters here more than usual, because the comments are what carry the
  reasoning that the tests cannot — "`Math.round` rounds half away from zero
  for negatives, and a basket cannot be negative, so the two agree here" is
  the kind of line this codebase is made of.
- **Do not add a dependency to either package without a reason that survives
  being written down.** Both have essentially none, and that is a property
  worth keeping for a repo whose job is to be installed quickly and
  repeatedly.
- **Do not add a build step to `apps/web`.** `noEmit` is set deliberately;
  the type check is the build. Introducing emitted output means introducing a
  decision about where it goes and whether it is committed.

## Deliberate exceptions

Places that look like they break a rule and should stay as they are, with the
reason. Without this section, cleanup keeps rediscovering them.

| Place | Looks like | Why it stays |
| --- | --- | --- |
| `apps/web/src/basket.ts` and `services/pricing/pricing/basket.py` | Two implementations of the same four functions — textbook duplication, and the first thing a cleanup pass would want to unify behind one language or a generated client. | The duplication *is* the fixture. `README.md`: the repo exists "for the thing a single-language fixture cannot test — one factory covering two apps". There is no bridge between the two languages and building one is an architectural decision, not a refactor. |
| `discounted` in `apps/web/src/basket.ts` uses `Math.round`, while the Python side needs `Decimal` and `ROUND_HALF_UP` | Asymmetric: the same rule implemented two different ways, so one of them looks like it is cutting a corner. | Neither is. `Math.round` is half-up for positive numbers, which is exactly what the contract asks. Python's built-in `round` is half-to-*even*, so `round(222.5)` is 222 and the `333`-less-`33%` row would come out a cent low — `Decimal` is the correction, not an over-engineering. Both files already carry this in a comment; do not "simplify" either to match the other. |
| `services/pricing` raises `ValueError` for a bad percentage where `apps/web` raises `RangeError` | The two implementations disagree on the error type, which looks like the divergence this repo is supposed to prevent. | Each language's own idiom. JavaScript has `RangeError` for a value outside an allowed range; Python does not, and `ValueError` is its equivalent. The *type* error is `TypeError` in both, where the two languages do agree. `CONTRACT.md` specifies values, not exception classes. |
| `isinstance(cents, bool)` in the `TypeError` guard in `services/pricing/pricing/basket.py` | A redundant check — `bool` passes `isinstance(x, int)` already, so the clause reads like belt-and-braces. | That is precisely why it is there: `bool` *is* a subclass of `int` in Python, so `discounted(True, 10)` would otherwise be accepted as one cent. The TypeScript side gets this for free from `Number.isInteger`. |
| Both test files duplicate the same five-row `CONTRACT` table as a literal | Copy-pasted test data; a reviewer would normally ask for one shared fixture file. | There is nowhere shared to put it — the two packages are in different languages with no build-time bridge — and extracting it to, say, a JSON file both read would weaken the check rather than strengthen it: the point is that each language independently encodes what `CONTRACT.md` says. Reading from a common file would make a wrong table wrong in both places at once. |
| `.github/workflows/ci.yml` runs the two suites in separate path-filtered jobs | Looks like it could be one job, and it means a PR touching only `apps/web` never runs the Python suite. | Deliberate, and the fixture's own stated subject: "a PR touching only `apps/web` should not run the Python suite, and a PR touching both should run both." Keep the filters. The sandbox's test command runs both anyway, which is the right asymmetry — CI optimises, verification does not. |
| `apps/web/tsconfig.json` sets `"noEmit": true` on a package called an "app" | A library configured as if it compiles to nothing, under a directory named `apps/`. | It genuinely compiles to nothing: there is no server, no bundler and no entry point. `tsc` here is a type checker, and the directory name describes which side of the contract it is, not that it runs. |
| Neither package has a coverage provider installed | An oversight, given `.factory/guardrails/coverage.json` asks for 80% diff coverage. | Recorded as a real gap rather than defended — see the sandbox manifest's `not_exercised`. Noting it here so it is not rediscovered as a surprise: adding `@vitest/coverage-v8` or `pytest-cov` is a dependency change in a repo that currently has almost none, and is worth doing deliberately rather than as a side effect of another change. |
