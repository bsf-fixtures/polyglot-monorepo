<!--
  How to build, run, test and verify this app. Written by setup's phase 2,
  with every command tested rather than copied from a README.

  This is the most load-bearing context file: a verifier agent that cannot
  start the app cannot verify anything, and then the factory produces
  confident unverified PRs.
-->

# Runbook — polyglot-monorepo

**There is no application here, so there is nothing to build, run or test.**
Every command below is empty because the repository contains no source file
and no package manifest in any ecosystem — not because setup failed to find
them. The sandbox manifest records tier `static` and all five commands as
`null` for the same reason.

If you are reading this because a change you are making needs a build, a test
run or a running app: this runbook is now out of date, and the change that
introduces the stack must also replace it. File an inadequacy report
(`bsf sandbox report`) so an amendment episode rebuilds the sandbox around
whatever actually arrives.

## Build

```bash
# none — nothing in this repo compiles or bundles
```

Searched for and did not find: `package.json`, `pyproject.toml`, `go.mod`,
`Cargo.toml`, `Gemfile`, `*.csproj`, `pom.xml`, `build.gradle*`, `Makefile`,
`Taskfile*`, `composer.json`, `mix.exs`, `deno.json`, `requirements*.txt`,
`Dockerfile`, `docker-compose*`/`compose.y*ml`, `.devcontainer/`. The only
tracked directories are `.factory/` and `.github/workflows/`.

## Run

```bash
# none — there is no application to start
```

The app is then at nowhere: no process listens, because no process exists.
`app_url` in the sandbox manifest is `null`.

## Test

```bash
# none — no test framework is configured and no test file exists
```

`.factory/guardrails/coverage.json` is at its bootstrap defaults
(`high_pct: 0`, `floor_pct: 0`), consistent with a repo whose coverage has
never been measured. `factory.yaml` sets `existing_ci.test_check: null`, so
the factory has no external test check to read either.

## Verify

How to see for yourself that the app works, as a developer would:

There is no app to see. What *can* be checked, and what the setup episode
actually ran:

1. **Confirm the tree really is empty of application code.** From the repo
   root:
   ```bash
   git ls-tree -r origin/main --name-only | grep -v '^\.factory/\|^\.github/'
   ```
   The only line is `README.md`. If anything else appears, this runbook is
   stale.
2. **Confirm the factory runner is intact.**
   ```bash
   .factory/bin/bsf --version
   ```
3. **Confirm the sandbox manifest is valid.**
   ```bash
   .factory/bin/bsf sandbox check
   ```
   Prints `valid sandbox manifest, tier static`. Until the setup pull request
   merges there is no `.factory/sandbox/manifest.json`, so this prints
   `no sandbox manifest` and exits 1 — that is the expected answer before
   setup lands, not a failure. To check a candidate file directly, pass
   `--file PATH`.
4. **Confirm the compiled agents match their sources.** `bsf audit` compares
   each `.github/workflows/factory-role-*.lock.yml` against the `.md` it was
   compiled from, using gh-aw's own hashing. It reads commits through the
   GitHub API, so it needs `GH_TOKEN` and is normally run by
   `factory-audit.yml` rather than locally. Never hand-edit a lock file to
   make it pass.

## Seed data

```bash
# none — there is no datastore, and nothing to seed
```

The sandbox starts no services, so there is nowhere for seed data to go.

## Commands that change persistent state

These are kept out of the build path on purpose. Each one writes to something
that outlives the process, so running it against the wrong target is the kind
of mistake that cannot be undone by reverting a commit.

| Command | Writes to | Only when |
| --- | --- | --- |
| `bsf practice add "<text>"` | Dispatches `factory-intake.yml`, which opens a pull request adding the practice to `practices.md`. | The repo's owner has stated the practice. Never to record an agent's own preference. |
| `bsf sandbox report --from PATH` | Appends a `sandbox-reports/<key>.json` entry to the factory data ref (`factory/bootstrap`) and dispatches `factory-setup.yml` to amend the sandbox. | A role genuinely could not exercise what a change needed. It restarts a setup round, so it costs real time. |
| `bsf gates record …` | Records a gate verdict against the head commit on the data ref, so the same commit is never re-checked. | Called by `factory-gates.yml`. Not by hand. |
| `bsf rollup` / `bsf intake` / `bsf run start` | Rebuild `index.json` and `ledger.json` and dispatch runs on the data ref. | Called by their own workflows. Not by hand. |

No command in this repo touches an application database, because there is
none.

## Services this app needs

| Service | How it starts | Reached at |
| --- | --- | --- |
| _(none)_ | The sandbox manifest declares `services: []`. Nothing to run means nothing to run it against. | — |

## The sandbox's environment

Built from this list, and from nothing else. It does not inherit a
developer's environment and it does not read any `.env` file, because a
documented build command that runs a migration would otherwise migrate
whatever a developer's credentials happen to point at.

| Variable | Value in the sandbox |
| --- | --- |
| _(none)_ | The manifest's `env` list is empty. No code in this repo reads configuration, because there is no code. |

The emptiness is deliberate and load-bearing: because the sandbox is closed,
the first real application added here will fail loudly on its first missing
variable rather than quietly reaching something of the owner's. That failure
is the signal to amend the manifest, not a bug to work around.
