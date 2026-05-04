---
title: Extending the Platform
status: active
last_updated: 2026-05-04
purpose: How to add a markdown pass, UI component, feature, or doc.
related:
  - ../architecture/markdown-pipeline.md
  - ./workflow.md
  - ../../evolution/workflow.md
---

# Extending the Platform <Badge type="warning" text="beta" />

All extension follows the same flow: **Idea → Activity → RFC (if architectural) → Code → Tests → Docs → PR**. Same flow regardless of subsystem.

## Add a Markdown Pass

The compiler is a topologically-sorted DAG of Passes. Each Pass has a phase, declared `reads`/`writes` keys, and a `run` function. Adding one:

1. Create `config/mdsvex/passes/<my-feature>.js` implementing the `Pass` interface — see [Pass Definition](../architecture/markdown-pipeline.md#execution-graph--scheduler).
2. Register in `config/mdsvex/engine/pass-groups.js` under the appropriate phase (`pre | remark | rehype | validate | post | extract`).
3. Add unit test at `config/mdsvex/passes/<my-feature>.test.js` — coverage **must** be 100% on the new Pass.
4. If the Pass changes the manifest schema, declare a new diagnostic code, or affects feature-flag chunking → write an ADR ([evolution/workflow.md](../../evolution/workflow.md)).
5. Update [`docs/platform/architecture/markdown-pipeline.md`](../architecture/markdown-pipeline.md) — at minimum the relevant phase section.

## Add a UI Component

UI lives under FSD layers. Pick by scope:

- **Reusable primitive** → `src/shared/ui/<Component>.svelte`.
- **Self-contained capability** → `src/features/<name>/`.
- **Page-level composition** → `src/widgets/<name>/`.

Imports flow upward only: `shared → entities → features → widgets → routes`. Never reach down.

Reuse before building: `CodeBlock`, `CodeTabs`, `CopyButton`, `MathCopy`, `Seo`, `Breadcrumb`, `StaticHtml`, `Logo`, `KaTeXStyles`.

If the component is allowed inside markdown content, it also needs a registry entry — see "Add a markdown-allowed component" below.

## Add a Feature

1. Scaffold an activity: copy `operations/templates/activities.md` → `operations/activities/YYYY/MM/<id>.md`. Fill `kind`, `subtype`, `intent`.
2. If the feature touches architecture (new top-level capability, new contract, new render path) — open an RFC first.
3. Implement under the correct FSD layer.
4. ≥ 90% coverage (Vitest), Playwright spec for any user flow.
5. Update `docs/platform/architecture/<subsystem>.md` if behavior changes.
6. PR: `gh pr create --fill`.

## Add a Markdown-allowed Component

If your post needs a custom Svelte component:

1. Add the component to `src/shared/ui/` (or appropriate FSD layer).
2. Register it in `config/mdsvex/registry.js` with `kind` (`block | inline`) and `allowedProps` (whitelist).
3. If the component accepts a URL or HTML attribute, add a security fixture in the registry tests.
4. Document the component in [writer/index.md](../writer/index.md) (and link from `frontmatter.md` if it adds a feature flag).

## Update Docs

- Same PR as the code change. Never «docs PR later».
- Frontmatter `last_updated` → today (`YYYY-MM-DD`).
- ≥ 1 cross-reference link inside the body to a related doc.
- If terminology changes → update mentions across all docs (use `sd` for project-wide substitutions, not `sed`).

## Add an ADR

1. Get next number: `ls docs/evolution/adr | tail -1`.
2. Copy `operations/templates/rfc.md` → `docs/evolution/adr/NNNN-<slug>.md`.
3. Status flow: `Draft → Proposed → Accepted` (after PR merge).
4. **Append-only**: never edit accepted ADRs. To revise, write a new ADR and add `Superseded by: NNNN` to the old one.

## Anti-Patterns (do NOT do)

- Adding a feature without an Activity record.
- Editing architecture docs without an ADR for the underlying decision.
- Creating new top-level folders in `docs/platform/` outside spec — only `writer/`, `developer/`, `architecture/` are allowed.
- Documenting structure outside [architecture/index.md → Directory Structure](../architecture/index.md#directory-structure).
- Mocking internals in tests — only system boundaries (WebGPU, fetch, localStorage).
- Deep customizing the VitePress theme — keep default.

## Related

- [Markdown Pipeline](../architecture/markdown-pipeline.md)
- [Engineering Workflow](./workflow.md)
- [Evolution Workflow](../../evolution/workflow.md)
