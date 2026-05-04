---
title: Engineering Workflow
status: active
last_updated: 2026-05-04
purpose: How a change moves from idea to merged PR — Git flow, PR flow, operations, AI loop.
related:
  - ./index.md
  - ./infrastructure.md
  - ./extending.md
  - ../../evolution/workflow.md
---

<!-- AGENT_CONTEXT

## AI Loop (Sprint Mode)

For multi-step features:

1. **Plan** — list files to touch, no code.
2. **Implement** — file edits only, no full rewrites.
3. **Commands** — return exact commands for the user to run.
4. **Run** — user executes, pastes output back.
5. **Iterate** — fix based on output.
6. **Merge** — PR landed.

Token economy and code rules: [conventions.md → AGENT_CONTEXT](./conventions.md).

## AI Loop (Per-PR Mode)

For small, self-contained changes — after implementation, AI returns commands only. No prose, no explanations.

```sh
git add <files>
git commit -m "<type>(<scope>): <subject>"
git push --force-with-lease
gh pr create --fill
```

-->

# Engineering Workflow <Badge type="tip" text="v1" />

A change moves through five phases: **branch → activity → implement → CI → merge**. Code, tests, and documentation always ship in the same PR.

## Branching

- Branch naming: `<type>/<slug>` where `<type>` ∈ `feat | fix | docs | refactor | perf | test | build | ci | chore`.
- One PR = one focused outcome. If the diff doesn't fit one mental model, split it.

## Conventional Commits

Mandatory; enforced by `commitlint` via the `commit-msg` lefthook.

- Format: `<type>(<scope>): <subject>`.
- Subject: imperative mood, ≤ 72 chars, lowercase, no trailing period.
- Examples:
  - `feat(markdown): add build-time mermaid pass`
  - `fix(background): respect maxDist in delaunay edges`
  - `docs(developer): document extending workflow`

## Operations

Work is tracked as **Activities** — single PR-sized units with metadata.

- **Inbox**: drop raw ideas to `operations/inbox/<slug>.md`.
- **Activity**: when ready, scaffold from `operations/templates/activities.md` → `operations/activities/YYYY/MM/<id>.md`.
- **Kanban**: `operations/dashboards/kanban.md` tracks WIP and Done.
- **RFC**: if architectural, open an RFC first ([evolution/workflow.md](../../evolution/workflow.md)).

Activity frontmatter tracks `kind`, `subtype`, `status`, `impact`, `effort`, `confidence`, `significance`, `timebox`, `started_at`, `completed_at`. Sections inside: `Intent`, `Scope`, `Work`, `Outcome`. Metrics (lead time, cycle time, velocity) are computed from timestamps and kanban state.

## Documentation Lifecycle

Architecture docs (`docs/platform/architecture/*.md`) carry a `<Badge>` that reflects the stability of the subsystem:

| Badge                                | Meaning                  | When to use                                   |
| ------------------------------------ | ------------------------ | --------------------------------------------- |
| `<Badge type="tip" text="v1" />`     | Stable, no active work   | Subsystem is mature and not changing          |
| `<Badge type="warning">beta</Badge>` | Stable enough to ship    | Before every commit that touches the doc      |
| `<Badge type="danger" text="dev" />` | Under active development | As soon as you start working on the subsystem |

Rule: when you start working on a subsystem, change its doc badge to `<Badge type="danger" text="dev" />`. Before you commit, change it back to `<Badge type="warning">beta</Badge>`.

## Command Contract

### PR start (once per branch)

Make sure your local `main` is in sync with `origin/main` before creating a branch:

```sh
git checkout main
git rev-parse HEAD origin/main
git checkout -b <type>/<slug>
```

### Per change

```sh
git add <files>
git commit -m "<type>(<scope>): <subject>"
```

### Follow-up pushes

```sh
git commit --amend --no-edit
```

```sh
git push --force-with-lease
```

```sh
gh pr comment --body "/gemini review"
```

### PR end (once per branch)

```sh
git push -u origin <branch>
```

```sh
gh pr create --fill
```

## Local validation

Before pushing:

```sh
just fmt
just check     # svelte-check + oxfmt --check + lefthook validate
just ci        # full local CI: audit + fmt + check + spell + lint + build
just tu        # fast unit tests (VITEST_FAST=true)
```

For a complete PR check including all browsers and coverage:

```sh
just ta        # unit + integration + coverage
```

## CI gates

CI must be green before merge. See [infrastructure.md](./infrastructure.md) for stage-by-stage detail.

| Stage      | Fail condition                                                                               |
| ---------- | -------------------------------------------------------------------------------------------- |
| Audit      | secrets / Trivy misconfig / banned dep                                                       |
| Lint       | any non-zero from oxfmt, oxlint, svelte-check, stylelint, knip, markdownlint, cspell, eslint |
| Build      | type errors / broken imports                                                                 |
| Playwright | spec failure or visual regression                                                            |
| Lighthouse | < 0.9 on perf / a11y / SEO / best-practices                                                  |
| Coverage   | < 90% global                                                                                 |
| Bundle     | size regression vs `misc/bundle-baseline.json`                                               |

## When to RFC

If the change introduces a new architectural contract — new pass type, new top-level folder, new build artifact, new render path — open an RFC first ([evolution/workflow.md](../../evolution/workflow.md)).

## Related

- [Developer Guide](./index.md)
- [Infrastructure](./infrastructure.md)
- [Extending the Platform](./extending.md)
- [Evolution Workflow](../../evolution/workflow.md)
