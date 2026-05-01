# CLAUDE.md

Static blog (Svelte 5 + SvelteKit 2 + Tailwind 4 → GitHub Pages).

## Commands

```sh
bun run dev          # http://localhost:5173
bun run build        # → target/build/
bun run preview      # http://localhost:4173
bun run check        # svelte-check + oxfmt
bun run test:unit    # Vitest (VITEST_FAST)
just lint            # oxlint + stylelint + knip + markdownlint
just fmt             # oxfmt --write
just ci              # audit + fmt + check + lint + build
just tu / ti / tc    # unit / E2E / coverage
```

Lefthook: pre-commit = oxfmt + oxlint on staged · pre-push = `bun run check`.

## Stack

Svelte 5 (Runes) · SvelteKit 2 (adapter-static) · Vite 8 · Bun · Tailwind v4 (`@theme` in `app.css`) · WebGPU + WGSL · mdsvex + Shiki + KaTeX · FlexSearch · Oxc · Vitest + Playwright.

## Architecture (FSD)

Imports flow upward only: `shared → entities → features → widgets → routes`.

| Alias       | Path           |
| ----------- | -------------- |
| `$widgets`  | `src/widgets`  |
| `$features` | `src/features` |
| `$entities` | `src/entities` |
| `$shared`   | `src/shared`   |
| `$lib`      | `src/lib`      |

### Key files

- `src/shared/config/site.ts` — site-wide config (nav, particles, hideThreshold)
- `src/app.css` — design tokens, `.glass`, `.mesh-gradient`, `.prose`
- `src/lib/content.ts` — `getPosts()` / `getPost(slug)`

### WebGPU — `src/features/background/`

`BackgroundRenderer` + `Simulation`. WGSL: `particles.wgsl`, `edges.wgsl`, `triangles.wgsl`. STRIDE=8 `[x,y,vx,vy,r,g,b,a]`. Delaunay every 3 frames; edges filtered by `maxDist=150`. Render: edges → particles (additive). Buffers via `device.queue.writeBuffer`. Entry: `BackgroundCanvas.svelte`.

### Content

Posts: `content/blog/*.md` + frontmatter (`title`, `tags`, `created`, `summary`, `draft`). Pipeline: mathPreprocess → vitePreprocess → mdsvex. Math `$x$` / `$$x$$`. Diagrams: ` ```mermaid `.

### Theme

`src/features/theme/theme.ts` — localStorage store, toggles `.dark` on `<html>`. Switch via `startViewTransition` + circular clip-path.

### Playwright

Base `http://localhost:4173`. `landing` (homepage.spec.ts) runs first; `chromium` depends on it.

## Style

Tabs · 100 cols · single quotes · es5 trailing commas · semicolons. Svelte 5 runes only. Avoid `// biome-ignore` except for `$state` reassignment. Oxlint: `noNonNullAssertion`/`no-console` → warn.

## Guardrails

- Coverage ≥ 90%
- Strict TS — no `any`
- Bun only
- No Svelte 4 syntax/stores
- No `tailwind.config.*`
- No WebGL / Three.js
- Reuse shared UI: `CodeBlock`, `CodeTabs`, `CopyButton`, `MathCopy`, `Seo`

## Workflow

- Conventional Commits; branches `<type>/<slug>`
- Plans → `.ai/plans/<YYYY-MM-DD>-<slug>.md` (own PR first)
- End of branch: `git push -u origin <branch>` + `gh pr create --fill`
- Updates: `git push --force-with-lease`
