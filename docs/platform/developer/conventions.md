---
title: Standards & Conventions
status: active
last_updated: 2026-05-04
purpose: Code style, doc style, commit format, AI agent rules, guardrails.
related:
  - ./workflow.md
  - ./testing.md
  - ../architecture/index.md
---

<!-- AGENT_CONTEXT
Strict rules: no any, no Svelte 4, no WebGL, Bun only, FSD imports upward.
Use unified diff. No full-file rewrites unless asked. No unrelated refactors.
Prefer short just aliases (tu, ti, ta, tc, bs, bb) to save tokens.
Directory Structure is canonical at architecture/index.md#directory-structure — link there, never duplicate.
-->

# Standards & Conventions <Badge type="tip" text="v1" />

## Code

- **Framework**: Svelte 5 with **Runes only**. No Svelte 4 stores or `$:` reactive syntax.
- **Types**: Strict TypeScript, no `any`. Pipeline state is end-to-end typed via `PipelineState` (see [markdown-pipeline.md](../architecture/markdown-pipeline.md)).
- **Format**: `oxfmt` is the single source of truth. Tabs · 100 cols · single quotes · es5 trailing commas · semicolons.
- **Lint**: oxlint (warn on `no-console`, `noNonNullAssertion`), stylelint, knip, eslint (Svelte AST only via `eslint-plugin-svelte`).
- **Architecture**: FSD layering — `shared → entities → features → widgets → routes`. Imports flow upward only.
- **Reuse**: shared UI primitives (`CodeBlock`, `CodeTabs`, `CopyButton`, `MathCopy`, `Seo`, `Breadcrumb`, `StaticHtml`, `Logo`, `KaTeXStyles`) before building new ones.

## Documentation

Every document under `docs/` MUST have:

- Frontmatter: `title`, `status`, `last_updated`, `purpose`, `related` (list of relative paths).
- `# H1` mirroring `frontmatter.title`.
- ≥ 2 cross-references to related docs (in body and in `## Related` section).

Naming:

- `kebab-case` for files and directories.
- ADR file: `NNNN-<slug>.md` (4-digit zero-padded).
- Activities: `YYYY-MM-DD-<kind>-<slug>.md`.

Directory structure: [architecture/index.md → Directory Structure](../architecture/index.md#directory-structure). Do not duplicate elsewhere.

## Commits & PRs

- **Conventional Commits**: `<type>(<scope>): <subject>` — enforced by commitlint.
- Allowed types: `feat | fix | docs | style | refactor | perf | test | build | ci | chore`.
- Subject: imperative, ≤ 72 chars, lowercase, no trailing period.
- One PR = one outcome. Code + tests + docs in same PR.
- Plans live in `operations/inbox/<YYYY-MM-DD>-<slug>.md`.
- Activities live in `operations/activities/<YYYY-MM-DD>-<slug>.md`.

## Guardrails

- **Coverage** ≥ 90% global.
- **Strict TS**, no `any`.
- **Bun only** — no `npm`, `yarn`, or `pnpm`.
- **No Svelte 4** syntax / stores.
- **No `tailwind.config.*`** — tokens live in `src/app.css` via `@theme`.
- **No WebGL / Three.js** — WebGPU only.
- **No raw HTML in markdown content** — register a Svelte component instead.

## Related

- [Engineering Workflow](./workflow.md)
- [Testing Strategy](./testing.md)
- [Architecture Overview](../architecture/index.md)
