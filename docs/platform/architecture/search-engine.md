---
title: Search Engine
status: active
last_updated: 2026-05-04
purpose: Build-time search index + lazy client-side FlexSearch with privacy by default.
related:
  - ./index.md
  - ./markdown-pipeline.md
  - ../developer/testing.md
---

# Search Engine <Badge type="warning">beta</Badge>

Search is build-time indexed (FlexSearch document index serialized to JSON at build), shipped via `/api/search.json`, and lazy-loaded on the client only when the user opens the command palette. No external service; results are 100% local.

## How it works

### 1. Build-time indexing

During the SvelteKit build, the `extractionPass` of the Markdown pipeline gathers metadata from every published, non-draft post and writes a unified `search.json`:

- **Payload fields**: `slug`, `title`, `summary`, `tags`.
- **Index config**: FlexSearch `Document` with `tokenize: 'forward'` and `resolution: 9`. Indexed fields: `title`, `tags`.
- **Output**: `target/build/api/search.json`, served as a static asset.

### 2. Client orchestration (`SearchModel`)

State managed by a Svelte 5 class-based model at `src/features/search/model/searchModel.svelte.ts`.

- **Lazy load**: index payload + FlexSearch library are fetched only when the user opens the command palette (`Ctrl+K`).
- **Hydrate**: payload is deserialized into a runtime FlexSearch index optimized for prefix and contextual matching.
- **Tag panel**: model aggregates tag counts from the payload to drive the "Search by tag" UI inside the palette.

### 3. Query

- **Debounce**: 150ms to keep typing snappy.
- **Ranking**: exact title match > prefix title > tag > body match.
- **Lifecycle**: index lives in memory until the page is navigated away from.

## Invariants

- **Privacy**: zero network calls beyond the static `search.json` fetch.
- **Exclusion**: `draft: true` posts and posts with critical compiler diagnostics are NEVER in the index.
- **Determinism**: payload is deterministically sorted (slug ASC); cache-busting uses asset hash.

## Debugging

```sh
bun run build
cat target/build/api/search.json | head -c 500
```

Or in browser DevTools → `window.__search_index` (dev mode only) / inspect `searchModel` state via Svelte DevTools.

## Related

- [Architecture Overview](./index.md)
- [Markdown Pipeline](./markdown-pipeline.md)
- [Testing Strategy](../developer/testing.md)
