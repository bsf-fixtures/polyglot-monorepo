<!--
  What has gone wrong before, and what was learned. Seeded by setup from the
  mined corrections, then added to by the scheduled review.

  This file is for failures whose lesson could not be turned into a check. A
  correction that became a rule does not belong here: the rule is the record,
  and repeating it in prose means two things to keep in step.
-->

# History — polyglot-monorepo

There is almost nothing to record, and that is the finding rather than a gap
in the search. `main` has a single commit — `72d8322 Upgrade the factory to
e29d8e0 (#4)` — so there is no corpus of review corrections to mine, no
revert, no incident, and no pattern of repeated mistakes. The tables below
stay empty until the factory produces runs that fail.

## Lessons

| What happened | What to do instead | Where it came from |
| --- | --- | --- |
| _(none recorded)_ | — | Searched: the full `git log` on `main` (one commit), all four branches, and the repo's tracked tree. No corrections, reverts or post-mortems exist to mine. |

## Problem classes already eliminated

Kept so nobody proposes a rule that exists, and so a regression is
recognisable as one.

| Problem class | How it was eliminated | When |
| --- | --- | --- |
| _(none recorded)_ | — | No guardrail rule has ever been added here: `.factory/guardrails/baselines.json` carries an empty `rules` map and `candidates.json` an empty list, which is the bootstrap state. |

## Escalations

Work the factory could not finish, and why. A pattern across several of these
is a signal about the factory rather than about the work.

| Work item | Where it stopped | Cause |
| --- | --- | --- |
| Setup phase 2, round 1 (this episode) | Produced a manifest at tier `static` instead of `renders`. Not a failure of the episode, but the limit is worth recording where the next reader will see it. | The repository contains no application: no source file and no package manifest in any ecosystem, so there is no install, build, test or run command to declare. Until application code lands, the factory can only apply static checks — and there is no linter configured either. |

## What a future reader should watch for

Not lessons yet, because nothing has gone wrong — but the two places this
repo is most likely to produce one:

- **An agent inferring a stack from the repo's name.** "polyglot-monorepo"
  describes an intent, not a tree. The first time something breaks here, the
  likeliest cause is a change written against an imagined TypeScript or Go
  workspace. `feature-map.md` records what is actually present.
- **The sandbox going stale the moment real code arrives.** The frozen
  manifest declares every command `null`. The change that adds a package
  manifest makes that manifest wrong, and the verifier will be unable to
  exercise it. The correct move is an inadequacy report
  (`bsf sandbox report`), which opens an amendment episode — not editing
  `.factory/sandbox/manifest.json` by hand, and not claiming a change is
  verified when only static checks ran.
