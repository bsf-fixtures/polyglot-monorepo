# polyglot-monorepo

Build Software Factory fixture: one repository, two applications, two
languages, two test runners.

It exists for the thing a single-language fixture cannot test — **one factory
covering two apps**. The feature map and the runbook need a section each; the
gates need to run the right tools in the right directory; a PR touching only
`apps/web` should not run the Python suite, and a PR touching both should run
both.

| Path | What it is | Tools |
| --- | --- | --- |
| `apps/web` | TypeScript cart UI logic | eslint, vitest |
| `services/pricing` | Python pricing rules | ruff, pytest |

The two share a contract and nothing else: the web app asks the service what
a basket costs. That contract is written down in `CONTRACT.md`, which is the
cross-artifact consistency check's reason to exist here — the rounding rule
is stated once and implemented twice.

## Test

```bash
# the web app
cd apps/web && npm ci && npm test

# the pricing service
cd services/pricing && pip install -e '.[dev]' && pytest
```

## What the factory should find here

- **Two sections, not one.** The feature map and the runbook each need a
  section per app; a single "run the tests" line is wrong for both.
- **The right tools in the right directory.** eslint and vitest in
  `apps/web`, ruff and pytest in `services/pricing`. A gate that runs them
  from the repository root finds nothing.
- **A contract implemented twice.** `CONTRACT.md` states the rounding rule
  once; both suites test the same five examples. Breaking one implementation
  fails exactly one suite, which is checked: truncating instead of rounding
  half up in the Python side fails four Python tests and no TypeScript ones.
