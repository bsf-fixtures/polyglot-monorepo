<!--
  How to build, run, test and verify this app. Written by setup's phase 2,
  with every command tested rather than copied from a README.
-->

# Runbook — polyglot-monorepo

Every command below is run from the **repository root** and was executed
there, verbatim, from a clean checkout. Each uses a subshell for its `cd`, so
it does not matter what ran before it.

Two packages, two toolchains. `install` sets up both; `build` and `test` each
cover both. Nothing here needs network access except `install`.

## Build

```bash
(cd apps/web && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint .) && (cd services/pricing && "${TMPDIR:-/tmp}/bsf-venv/pricing/bin/ruff" check .)
```

**apps/web** — `tsc --noEmit` is the whole build. `tsconfig.json` sets
`noEmit`, so there is no compiled output anywhere in this repo; the type check
*is* the build step, and it runs under `strict` and `noUncheckedIndexedAccess`
over both `src/` and `test/`. `eslint .` then runs the flat config in
`eslint.config.mjs` (`@eslint/js` recommended plus `typescript-eslint`
recommended).

**services/pricing** — there is no build. Python needs none, and the package
is installed editable, so a change to `pricing/` is live without reinstalling.
`ruff check .` runs instead, with the `E, F, B, SIM, RET, ARG` selection from
`pyproject.toml` against `target-version = "py311"`.

Both linters are in the build command because `.github/workflows/ci.yml` runs
both and because, without ruff, the build would cover only `apps/web`. A lint
finding therefore fails the build, which is the same thing CI does.

These binaries are addressed by path on purpose. `npx tsc` would silently
download TypeScript from the registry if `node_modules` were missing, turning
a skipped install into a slow pass instead of an immediate failure.

### Install, first

```bash
(cd apps/web && npm ci) && python3 -m venv "${TMPDIR:-/tmp}/bsf-venv/pricing" && "${TMPDIR:-/tmp}/bsf-venv/pricing/bin/python" -m pip install -e "./services/pricing[dev]"
```

`npm ci` (not `npm install`) because `apps/web/package-lock.json` is
committed and CI uses `ci`.

The Python side installs into a virtualenv under `TMPDIR` rather than into the
runner's interpreter, for two reasons. The system `python3` on a current
Ubuntu runner is marked externally-managed, so a bare `pip install` is
refused under PEP 668 — `ci.yml` avoids this only because it runs
`actions/setup-python` first, and the sandbox does not. And the virtualenv
lives outside the checkout because `.gitignore` covers `node_modules/`,
`__pycache__/`, `*.egg-info/`, `.pytest_cache/` and `.ruff_cache/` but has no
entry for a virtualenv: a `.venv/` inside the tree would be untracked, and a
`git add -A` would commit several thousand files. `TMPDIR` is one of the six
variables the sandbox's closed environment carries through, and install always
runs before build and test, so the path is stable wherever it is used.

**`install` is the only command that needs the network** — the npm registry
and PyPI. Build and test were verified to pass with an environment stripped to
just `PATH`, `HOME`, `TMPDIR`, `LANG` and `CI`.

## Run

```bash
# Nothing to run. There is no application here.
```

The app is then at **no URL — neither package starts**.

`apps/web` is a library: `noEmit`, no `start`/`dev`/`serve` script, no
bundler, no HTML, no DOM code. `services/pricing` is a library: no
`__main__`, no ASGI or WSGI app, no web framework, and an empty `dependencies`
list. There is no process to start and nothing to point a browser at. This is
why the sandbox tier is `build_and_test` and not `renders`.

If a change introduces a server, this runbook and the sandbox manifest both
need updating — that is an amendment, not an edit.

## Test

```bash
(cd apps/web && ./node_modules/.bin/vitest run) && (cd services/pricing && "${TMPDIR:-/tmp}/bsf-venv/pricing/bin/pytest" -q)
```

19 tests, roughly a second in total: **9 vitest** in `apps/web/test/basket.test.ts`
and **10 pytest** in `services/pricing/tests/test_basket.py`.

`vitest run` and not `vitest` — bare `vitest` enters watch mode and never
exits. `npm test` in `apps/web` resolves to the same `vitest run`; the direct
path is used for the same reason as in the build step.

**Both suites run together, always.** `ci.yml` splits them across two
path-filtered jobs so a PR touching only `apps/web` skips the Python suite.
That is a CI scheduling choice and it is wrong for verification: the contract
in `CONTRACT.md` is implemented twice, and running only one side is exactly
how a divergence gets through. The cost of running both is about a second.

To run just one while iterating:

```bash
(cd apps/web && ./node_modules/.bin/vitest run)                              # TypeScript only
(cd services/pricing && "${TMPDIR:-/tmp}/bsf-venv/pricing/bin/pytest" -q)    # Python only
```

**Coverage cannot be measured.** Neither package has a coverage provider
installed — no `@vitest/coverage-v8` in `apps/web/package.json`, no
`pytest-cov` in the `dev` extra of `services/pricing/pyproject.toml` — so
`vitest --coverage` and `pytest --cov` do not work. `.factory/guardrails/coverage.json`
asks for 80% diff coverage, which nothing here can currently produce.

## Verify

How to see for yourself that a change works, as a developer would. There is no
screen to look at, so verification is the test suites plus one deliberate
break:

1. **Install, build, test** — the three commands above, from the repository
   root, in that order. Expect `tsc` and both linters silent, 9 vitest tests
   passing, 10 pytest tests passing.
2. **Check the change against `CONTRACT.md` by hand.** If it touches
   `discounted` or `basketTotal` in either language, open `CONTRACT.md` and
   confirm the five rows still hold, especially `333` less `33%` = `223`. That
   row is the one that distinguishes rounding the total from rounding per
   line, and `445` less `50%` = `223` distinguishes half-up from Python's
   default half-to-even.
3. **Break it on purpose and watch the right suite fail.** The repo's central
   claim is that the two implementations are pinned to each other. Confirm it:
   replace `exact.quantize(Decimal("1"), rounding=ROUND_HALF_UP)` in
   `services/pricing/pricing/basket.py` with `int(exact)`, run the test
   command, and expect **4 pytest failures and 0 vitest failures**. Revert and
   confirm `git diff` is clean. (Run during setup; this is the observed
   result, not a prediction.)
4. **If the change touches only one language, say why.** A change to the
   rounding rule that edits one implementation and not the other is either a
   bug or a deliberate divergence that `CONTRACT.md` must record.

## Seed data

```bash
# None. There is no datastore to seed.
```

Both packages are pure functions over integer cents, with no persistence, no
fixtures beyond the literals in the test files, and no I/O.

## Commands that change persistent state

These are kept out of the build path on purpose. Each one writes to something
that outlives the process, so running it against the wrong target is the kind
of mistake that cannot be undone by reverting a commit.

| Command | Writes to | Only when |
| --- | --- | --- |
| — | — | **None found.** No migration, no deploy, no publish, no destructive script. Nothing in this repo writes outside its own working tree, and nothing it writes outlives the checkout. There is no Dockerfile, compose file or devcontainer, and `.github/workflows/ci.yml` only installs, lints and tests. |

## Services this app needs

| Service | How it starts | Reached at |
| --- | --- | --- |
| — | — | **None.** No database, cache, queue, object store, mail catcher or third-party API. Neither package opens a socket or touches the filesystem. The sandbox starts no containers. |

## The sandbox's environment

Built from this list, and from nothing else. It does not inherit a
developer's environment and it does not read any `.env` file, because a
documented build command that runs a migration would otherwise migrate
whatever a developer's credentials happen to point at.

| Variable | Value in the sandbox |
| --- | --- |
| — | **The list is empty, and that is a finding rather than a gap.** Searching `apps/` and `services/` for `process.env`, `os.environ`, `getenv` and `dotenv` returns nothing: no environment variable is read anywhere in this repo. There is no `.env` file, no settings module and no config file beyond the two toolchain manifests. The sandbox gives the app nothing because the app asks for nothing, and no secret of the owner's is involved at any point. |

The sandbox does still carry the six variables every shell needs — `PATH`,
`HOME`, `TMPDIR`, `LANG`, `CI` and `RUNNER_TEMP` — which is why
`${TMPDIR:-/tmp}` is safe to use in the commands above. Build and test were
checked under exactly that environment and nothing else.
