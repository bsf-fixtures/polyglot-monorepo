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

This repo has no application code, so it has no application conventions. Every
pattern below was read off the factory scaffolding that *is* here. None of it
tells you how to write a feature; it tells you how to work on this repo
without breaking the factory. When the first application code lands, this file
needs real rows — do not treat its current contents as a style guide for a
product.

## Dominant patterns

For each recurring concern, the pattern most of this codebase already uses.
Follow it rather than introducing a second way of doing the same thing.

| Concern | The pattern here | Source |
| --- | --- | --- |
| Agent workflows | Each of the seven roles is a `factory-role-*.md` source compiled by gh-aw into a `factory-role-*.lock.yml`. The source is edited; the lock is generated. | All seven pairs in `.github/workflows/`; the lock files carry `DO NOT EDIT` in their header. |
| Running the factory runner inside a workflow | Re-check out `.factory/bin` from the **default branch** into a temp dir, copy it to `$RUNNER_TEMP/bsf`, put that on `PATH`, and print `bsf --version` before using it. Never invoke `.factory/bin/bsf` from the checked-out PR tree. | `factory-setup.yml`, `factory-setup-trial.yml` — every job that uses `bsf` repeats this block, under the heading "Fetch the factory runner from the default branch". |
| Checkout credentials | `persist-credentials: false` on checkouts in the trial and freeze paths, with a short-lived App token minted only for the step that actually writes. | `factory-setup.yml` (`actions/create-github-app-token`, scoped to `contents: write`, `pull-requests: write`, this repo only). |
| Trust boundary for configuration | Only `.factory/definition/` and `.factory/sandbox/` are treated as trusted input; the runner hard-codes that prefix list. | `TRUSTED_PREFIXES` in the packed runner. |
| GitHub writes from an agent | Agents never call an authenticated `gh`; they declare writes through safe-output tools and the harness applies them afterwards. | The `safeoutputs` MCP server configured in every `factory-role-*.lock.yml`. |
| Explaining a file | Every hand-written file in `.factory/definition/` opens with an HTML or `#` comment saying why the file exists and what belongs in it, before any content. | `factory.yaml`, `policy.yaml`, all five `context/*.md` templates. |
| Check versus prose | Anything a static rule can decide goes to `.factory/guardrails/`; only judgement calls go in prose context files. | Stated in the headers of `fundamentals.md` and `practices.md`. |

## Product intent

What this product is trying to be, where that would change a decision an
agent has to make.

The README is two lines: *"Build Software Factory: Fixture of a Polygot
monorepo to install factory on"* (the typo is in the original). That is the
whole statement of intent available, and it describes the repo's role rather
than a product: it exists so the factory can be installed and exercised
against it.

What follows for decisions an agent has to make:

- **The name promises a polyglot monorepo; the tree does not contain one.**
  Do not infer a stack. There is no hidden workspace, no other branch with
  code (checked: `main`, `factory/bootstrap`, `upgrade-e29d8e0`,
  `upgrade-factory`), and no sparse-checkout trick. A change that assumes
  TypeScript, Go or Python is assuming.
- **There is no user to serve yet**, so "what would the product want" cannot
  settle an argument here. Until application code exists, prefer the choice
  that keeps the factory's own machinery working and reviewable.
- **Scope discipline matters more than usual.** With nothing to break, it is
  easy to build far past what was asked. The repo's own history is a single
  commit; keep changes that size.

## Taste

Things a reviewer would ask for that no rule states.

- **Say what is absent rather than filling a template.** These context files
  were generated from templates with `{{PLACEHOLDER}}` slots. An honest
  "none, and here is what I searched for" is worth more than a plausible
  invented row, because the next agent acts on what it reads here.
- **Comments explain the reason, not the mechanism.** Every header in
  `.factory/definition/` justifies the file's existence; follow that register
  rather than describing what the code already says.
- **Prefer a failure that is loud.** The sandbox is closed on purpose so a
  missing variable breaks the app instead of silently reaching a real
  service. Carry that instinct into new code: do not paper over a missing
  dependency with a default that happens to work.
- **Do not hand-edit generated artefacts.** A `.lock.yml` edited to make a
  check pass is worse than a failing check, because the next recompile
  silently reverts it.
- **Leave a trail someone can audit.** The factory's design — captured
  rounds, recorded episodes, the `captured_from`/`captured_at` fields on
  stubs — assumes a human will later ask "where did this come from?" Write so
  that question has an answer.

## Deliberate exceptions

Places that look like they break a rule and should stay as they are, with the
reason. Without this section, cleanup keeps rediscovering them.

| Place | Why it stays | Source |
| --- | --- | --- |
| `.factory/bin/runner.tgz` — a binary tarball of source committed to the repo | Packed "so that no linter, formatter or type checker in this repo reads it". Unpacking it into tracked source would drag the runner into this repo's own static gates. Upgrade by replacing the whole file. | The comment at the top of `.factory/bin/bsf`. |
| `.github/workflows/factory-role-*.lock.yml` — large generated files, committed | GitHub Actions can only run committed workflow files, so the compiler's output has to be in the tree. Edit the `.md` and recompile; `bsf audit` catches divergence. | The `DO NOT EDIT` header in each lock file. |
| The vendored gh-aw hashing helpers in the runner (`frontmatter_hash_pure.cjs` and its two helpers), copied verbatim rather than reimplemented | Reimplementing gh-aw's frontmatter normalisation from the outside "is how a staleness check ends up wrong in the field: it would either miss a real edit or cry stale on every clone". gh-aw keeps a parity test against its Go implementation, so using the file itself means `bsf audit` computes the same hash the compiler did. Nothing is modified; the origin commit is recorded. | `vendor/gh-aw/README.md` inside `runner.tgz`. |
| An untracked `.gitignore` in the working tree ignoring `.playwright-cli/` | It is not part of the repo — `git ls-files` does not list it; the agent harness writes it into the checkout. The directory it hides is browser-tooling output that "may contain credentials". Do not commit either the ignore file or the directory, and do not treat the rule as a repo convention. | Working tree only, confirmed untracked against `git ls-tree -r origin/main`. |
| `.factory/guardrails/*.json` sitting at zero — `rules: {}`, `candidates: []`, `floor_pct: 0` | These are not slack that someone forgot to tighten; there is no linter and no test suite for them to describe. They should rise when a stack arrives, not before. | The three files, plus `existing_ci.test_check: null` in `factory.yaml`. |
