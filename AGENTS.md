# AGENTS.md — AI Agent Contract

## Objective

Minimize tokens. Maximize signal.
Default: **concise, structured, actionable**.

---

## Core Rules

- No full files unless required
- Prefer **diffs / patches / snippets**
- No repetition of user input
- No explanations unless asked
- Stay strictly within **Scope**
- Correctness > Brevity

---

## Input Contract

```
Context: <1–2 lines>
Goal: <target>
Problem: <symptom>
Scope: <strict boundaries>
Artifacts: <minimal code/logs>
Constraints: (optional)
```

---

## Token Optimization

- No full logs / lockfiles
- Logs ≤ ~50 lines
- Code = minimal reproducible snippet
- Prefer references over duplication

---

## Code Rules

- Use **unified diff**
- No unrelated refactors
- No renames unless required
- Preserve architecture

---

## Forbidden

- Full file rewrites
- Repeating input
- Theory / fluff
- Overengineering
- Guessing outside scope

---

## Communication Protocol

Two modes depending on task size.

### Sprint Mode

For multi-step features/bugs — AI drives a tight loop:

1. **Plan** — List files to touch, no code yet
2. **Implement** — Edits only, no full rewrites
3. **Commands** — Return exact commands for you to run
4. **You run** — Execute, paste output back
5. **Feedback → iterate** — Fix issues based on output
6. **Merge** — PR created and merged

### Per-PR Mode

For small, self-contained changes — after implementation, AI returns commands only:

```sh
# verify commands, e.g. `just ci` or `just check`

git add <files>
git commit -m "<type>(<scope>): <subject>"
git push --force-with-lease
gh pr create --fill
gh pr comment --body "/gemini review"
```

No explanations, no extra steps. Commands only.

---

## Command Contract

### Start PR

```sh
just ci
just ta
git checkout main
git pull --rebase
git checkout -b <type>/<slug>
```

### Per change

```sh
git add <files>
git commit -m "<type>(<scope>): <subject>"
```

### Amend (no reword)

```sh
git commit --amend --no-edit
```

### Updates

```sh
git push --force-with-lease
```

### Review

```sh
gh pr comment --body "/gemini review"
```

---

## Stack

- **Framework**: Svelte 5 (Runes only), SvelteKit 2 (static adapter)
- **Build**: Vite 8, Bun (package manager + runtime)
- **Styling**: Tailwind CSS v4 (`@theme` in `app.css`, no `tailwind.config`)
- **Graphics**: WebGPU with WGSL shaders only (no WebGL / Three.js)
- **Content**: mdsvex + Shiki + KaTeX + Mermaid
- **Search**: FlexSearch
- **Tooling**: Oxc (oxfmt + oxlint), ESLint (Svelte only), Stylelint, Knip, CSpell, Markdownlint
- **Testing**: Vitest (jsdom) + Playwright (chromium + firefox, desktop + mobile)
- **Hooks**: Lefthook + commitlint (Conventional Commits)

---

## Architecture (FSD)

Imports flow upward only: `shared → entities → features → widgets → routes`.

| Alias       | Path           |
| ----------- | -------------- |
| `$shared`   | `src/shared`   |
| `$entities` | `src/entities` |
| `$features` | `src/features` |
| `$widgets`  | `src/widgets`  |
| `$lib`      | `src/lib`      |

### Layer responsibilities

- **`src/shared`** — Reusable UI primitives, config, styles, utilities. Key exports: `CodeBlock`, `CodeTabs`, `CopyButton`, `MathCopy`, `Seo`, `Breadcrumb`, `StaticHtml`, `Logo`, `KaTeXStyles`.
- **`src/entities`** — Domain models and thin UI. `post` (blog post types, server loaders), `codeTheme` (syntax theme registry).
- **`src/features`** — Independent user-facing capabilities.
  - `background` — WebGPU particle simulation (`BackgroundCanvas`, `Simulation`, WGSL passes).
  - `engine` — WebGPU compute/render pipeline core (`DeviceManager`, pass system).
  - `search` — FlexSearch indexing and UI.
  - `theme` — Dark/light mode store + toggle with `startViewTransition`.
- **`src/widgets`** — Page-level compositions assembled from features/entities.
  - `blog`, `landing`, `layout`, `post`, `search`, `settings`, `theme`.
- **`src/routes`** — SvelteKit file-system routes. Mostly thin shells delegating to widgets.
- **`src/lib`** — Cross-cutting utilities not tied to FSD layers (highlighter, math preprocessor, assets).
- **`src/content`** — Markdown blog posts (`blog/YYYY/YYYY-MM-DD-slug.md`) and static pages (`pages/`).
- **`config/mdsvex`** — Markdown engine pipeline steps (code, math, reading time, rehype headings).

---

## Key Files

- `src/shared/config/site.ts` — Site config: nav, author, particles, theme defaults, code themes.
- `src/app.css` — Design tokens (`@theme`), `.glass`, `.mesh-gradient`, dark/light overrides.
- `src/app.html` — HTML shell with inline theme-avoid-flash script.
- `svelte.config.js` — Preprocess order: `mathPreprocess → vitePreprocess → mdsvex`.
- `vite.config.ts` — Build chunks: `markdown-katex`, `markdown-mermaid`, `markdown-runtime`.
- `mdsvex.config.js` — Delegates to `config/mdsvex/index.js`.

---

## Content Pipeline

Posts: `src/content/blog/YYYY/YYYY-MM-DD-slug.md` with frontmatter (`title`, `tags`, `created`, `summary`, `draft`).

Pipeline at build time:

1. `mathPreprocess` — Preserves LaTeX backslashes before Vite/Svelte processing.
2. `vitePreprocess` — Standard Svelte/Vite compile.
3. `mdsvex` — Custom engine (`config/mdsvex/engine.js`) with steps:
   - `readingTimeStep`
   - `rehypeHeadingsStep` (autolink + slug)
   - `codeStep` (Shiki highlighting, code tabs)

Math: inline `$x$`, block `$$x$$`. Diagrams: ` ```mermaid `.

---

## WebGPU Background

Entry: `src/features/background/ui/BackgroundCanvas.svelte`.

- `BackgroundRenderer` + `Simulation` classes.
- WGSL shaders: `particles.wgsl`, `edges.wgsl`, `triangles.wgsl`, `composite.wgsl` (at `src/features/engine/shaders/`).
- Particle STRIDE=8 `[x, y, vx, vy, r, g, b, a]`.
- Delaunay triangulation every 3 frames via `d3-delaunay`; edges filtered by `maxDist=150`.
- Render order: edges → particles (additive blending).
- Buffer updates via `device.queue.writeBuffer`.
- Static fallback: `.mesh-gradient` CSS class when WebGPU unavailable.

---

## Commands

### Development

```sh
just dev              # Start Vite dev server (http://localhost:5173)
just build            # Production static build → target/build/
just preview          # Serve production build (http://localhost:4173)
just check            # Type check (svelte-check + oxfmt --check + lefthook validate)
just lint             # oxlint + stylelint + knip + eslint
just fmt              # oxfmt --write + just --fmt
just spell            # cspell + markdownlint --fix
just ci               # audit + fmt + check + spell + lint + build
just clean            # rm target, .svelte-kit, node_modules
```

### Testing

```sh
just tu               # Fast unit tests (Vitest, VITEST_FAST=true)
just ti               # Playwright integration tests (local, chrome-desktop)
just tc               # Unit tests with coverage
just ta               # All tests: unit + integration + coverage
just test lhci        # Lighthouse CI
just test bundle      # Bundle budget check
```

### Baselines

```sh
just bs               # Update Playwright snapshots for current OS
just baseline ci      # Update snapshots via Docker (Linux/chrome-desktop)
just bb               # Update bundle baseline
```

### Authoring

```sh
just new "Post Title" # Scaffold a new blog post
```

### Direct npm scripts

```sh
bun run dev
bun run build
bun run preview
bun run check
bun run test:unit
bun run test:playwright
bun run test:unit:coverage
```

---

## Testing Strategy

### Unit tests (Vitest)

- Environment: `jsdom`.
- Fast mode (`VITEST_FAST=true`) skips slow UI tests:
  - `src/routes/**/*.svelte.test.ts`
  - `src/shared/ui/**/*.test.ts`
  - `src/widgets/**/ui/*.test.ts`
  - `src/features/background/ui/*.test.ts`
  - `src/widgets/search/ui/*.test.ts`
- Setup: `tests/setup.ts` mocks Shiki highlighter, WebGPU APIs, `localStorage`, `ResizeObserver`, `IntersectionObserver`.
- Coverage provider: v8. Target **≥ 90%**.
- Coverage exclusions: test files, `.d.ts`, `index.ts`, app shell, data/interface files.

### Integration / E2E (Playwright)

- Local config: `playwright.config.ts` — chrome-desktop only, webServer via `bun run serve:playwright`.
- CI config: `playwright.ci.config.ts` — matrix: chrome-desktop, chrome-mobile, firefox-desktop, firefox-mobile.
- Landing (`homepage.spec.ts`) runs first per target; other specs depend on it.
- Snapshot tests: visual regression on `chrome-desktop` (`post-ux.spec.ts`).
- A11y: `@axe-core/playwright` assertions in `a11y.spec.ts`.

### Lighthouse

- Config: `.lighthouserc.json`.
- URLs: `/`, `/blog/`, `/about/`.
- Asserts: performance ≥ 0.9, accessibility ≥ 0.9, SEO ≥ 0.9, best-practices ≥ 0.9.
- Skips PWA, HTTPS, and legacy JS audits.

---

## Linting & Formatting

- **Oxlint** — JS/TS/Svelte linting (`.oxlintrc.json`). `no-console`/`noNonNullAssertion` → warn. Globals for Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`, `$bindable`).
- **Oxfmt** — Formatter (replaces Prettier). 100 cols, tabs, single quotes, es5 trailing commas, semicolons.
- **Stylelint** — CSS/Svelte linting (`.stylelintrc.json`). Tailwind v4 at-rules whitelisted.
- **ESLint** — Svelte AST only (`eslint.config.js`).
- **Knip** — Detects unused exports/dependencies (`knip.json`).
- **CSpell** — Spell checking (`cspell.json`).
- **Markdownlint** — `src/content/**/*.md`.

### Lefthook (Git hooks)

Config: `lefthook.yml`.

- `pre-commit` (sequential):
  1. `oxfmt --write` on staged `*.{js,ts,svelte,json,css,yml,md}`
  2. `oxlint --fix --deny-warnings` on staged `*.{js,ts,svelte}`
  3. `stylelint --fix` on staged `*.{css,svelte}`
  4. `markdownlint-cli2 --fix` on `src/content/**/*.md`
  5. `cspell` on staged `*.{md,svelte,ts}`
  6. `bun audit`
- `commit-msg`: `commitlint --edit` (Conventional Commits).

---

## CI / CD

Workflow: `.github/workflows/ci.yml`.

Jobs (in order):

1. **Audit** — Trivy filesystem scan (secrets, misconfig), Semgrep (typescript rules), dependency review on PRs.
2. **Lint** — oxfmt, oxlint, svelte-check, stylelint, knip, markdownlint, cspell, eslint.
3. **Build** — Static build with `ANALYZE=true`, bundle visualization, artifacts uploaded.
4. **Playwright** — Matrix (chrome-desktop, chrome-mobile, firefox-desktop, firefox-mobile) against built artifact.
5. **Lighthouse** — chrome-desktop only.
6. **Coverage** — Vitest with v8 coverage, uploaded to Codecov.
7. **Bundle** — Compare bundle stats against `misc/bundle-baseline.json`.
8. **Deploy GitHub Pages** — On `main` push, via `actions/deploy-pages`.
9. **Deploy Cloudflare Pages** — App + infra pages. PRs get preview deployments + sticky comment with links.

### Deployment targets

- **GitHub Pages**: production from `main`.
- **Cloudflare Pages**: production from `main`; PR previews via Wrangler.
- **Infra Pages**: aggregated Playwright + Lighthouse + bundle reports.

---

## Style & Conventions

- **Tabs** · 100 cols · single quotes · es5 trailing commas · semicolons.
- **Svelte 5 runes only** — no Svelte 4 syntax or stores.
- **Strict TypeScript** — no `any`. `checkJs: true`, `maxNodeModuleJsDepth: 0`.
- **No `tailwind.config.*`** — tokens live in `src/app.css` via `@theme`.
- **No WebGL / Three.js** — WebGPU only.
- **Shared UI reuse** — `CodeBlock`, `CodeTabs`, `CopyButton`, `MathCopy`, `Seo`.
- **Conventional Commits** required.
- **Branches**: `<type>/<slug>`.
- **Plans**: `.ai/plans/<YYYY-MM-DD>-<slug>.md` (own PR first).

---

## Guardrails

- Coverage ≥ 90%
- Strict TS (no `any`)
- Bun only
- No Svelte 4 syntax/stores
- No `tailwind.config.*`
- No WebGL / Three.js
- Reuse shared UI: `CodeBlock`, `CodeTabs`, `CopyButton`, `MathCopy`, `Seo`

---

## Priority

```
Correctness > Brevity > Completeness
```
