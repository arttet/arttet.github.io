# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal blog and portfolio of Artyom Tetyukhin. Static site (Svelte 5 + SvelteKit 2 + Tailwind 4), deployed to GitHub Pages. Active branch: `feat/svelte-migration`.

## Commands

```bash
bun run dev          # dev server → http://localhost:5173
bun run build        # production build → build/
bun run preview      # preview build → http://localhost:4173
bun run check        # svelte-check type-check
just lint            # biome check + oxlint
just fmt             # biome format --write + just --fmt
just ci              # check + lint + build (full gate)
just test            # build + playwright run
just test-ui         # build + playwright interactive
```

Pre-commit: `biome check --write`. Pre-push: `bun run check`.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Svelte 5, SvelteKit 2 (adapter-static) |
| Bundler | Vite 8, Bun |
| Styling | Tailwind CSS v4 + CSS custom properties |
| WebGPU | Pure WebGPU + d3-delaunay |
| Content | mdsvex, Shiki (6 themes), KaTeX |
| Search | FlexSearch |
| Linting | Biome v2, OXlint |
| Testing | Playwright (E2E only) |

## Architecture

### Path aliases

| Alias | Resolves to |
| --- | --- |
| `$features` | `src/features` |
| `$shared` | `src/shared` |
| `$entities` | `src/entities` |
| `$lib` | `src/lib` |

### Key files

- `src/shared/config/site.ts` — single source of truth for all site-wide config (nav links, particle settings, nav hide threshold)
- `src/app.css` — design tokens (CSS vars), `.glass`, `.mesh-gradient`, `.prose`
- `src/lib/content.ts` — `getPosts()` / `getPost(slug)` via `import.meta.glob`

### WebGPU background — `src/features/background/`

Two classes: `BackgroundRenderer` (WebGPU init, RAF, two render passes), `Simulation` (CPU particle physics + Delaunay edges). Shaders in WGSL: `particles.wgsl`, `edges.wgsl`, `triangles.wgsl`.

Simulation STRIDE = 8: `[x, y, vx, vy, r, g, b, alpha]`. Delaunay recomputed every 3 frames via `d3-delaunay`. Edges filtered by `maxDist` (default 150 px).

Render order per frame:

1. **Edge pass** — instanced triangle-strip quads, one instance per Delaunay edge (additive blend)
2. **Particle pass** — instanced point-sprite quads (additive blend)

GPU buffers updated CPU→GPU every frame via `device.queue.writeBuffer`. Canvas format uses `alphaMode: 'premultiplied'`.

Entry point: `src/features/background/ui/BackgroundCanvas.svelte`.

### Content model

Blog posts in `src/content/blog/*.md` with YAML frontmatter: `title`, `tags`, `created` (ISO 8601), `summary`, `draft`.

Preprocessing chain: **mathPreprocess** → **vitePreprocess** → **mdsvex**. Math: `$inline$` / `$$display$$`. Diagrams: ` ```mermaid `.

### Theme system

`src/features/theme/theme.ts` — Svelte store, persists to localStorage, toggles `.dark` on `<html>`. Theme switch uses `document.startViewTransition()` with circular `clip-path` reveal.

### Playwright E2E

Base URL: `http://localhost:4173`. Project order: `landing` (homepage.spec.ts) runs first; `chromium` depends on it and runs all other specs.

## Code style

- **Indent**: tabs · **Line width**: 100 · **Quotes**: single · **Trailing commas**: es5 · **Semicolons**: always
- Svelte 5 runes only: `$state`, `$derived`, `$props`, `$effect`. No Svelte 4 stores for new code.
- Avoid `// biome-ignore` unless a `$state` variable must be reassigned.
- `noNonNullAssertion` → warn, `no-console` → warn (oxlint).
