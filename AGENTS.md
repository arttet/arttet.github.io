# AGENTS.md — Project Context for AI Agents

Personal blog and portfolio.
Static site (Svelte 5 + SvelteKit + Tailwind 4), deployed to GitHub Pages.

---

## Stack

| Layer                | Choice                                                                         |
| -------------------- | ------------------------------------------------------------------------------ |
| Framework            | Svelte 5 (Runes), SvelteKit 2 (adapter-static)                                 |
| Bundler              | Vite 8, Bun (package manager)                                                  |
| Styling              | Tailwind CSS v4 + custom CSS variables (`app.css`)                             |
| Graphics Engine      | WebGPU (Compute & Render pipelines) + d3-delaunay                              |
| Content              | mdsvex (Markdown → Svelte), Shiki (syntax highlighting), KaTeX (math), Mermaid |
| Search               | FlexSearch                                                                     |
| Linting & Formatting | Oxfmt, OXlint, Stylelint, Markdownlint, Knip                                   |
| Testing              | Vitest + Testing Library (Unit), Playwright (E2E)                              |

---

## Commands

```bash
bun run dev          # dev server → http://localhost:5173
bun run build        # production build → target/ (generates stats.html via visualizer)
bun run preview      # preview build → http://localhost:4173
just check           # svelte-kit sync + svelte-check + oxfmt check
just lint            # oxlint, stylelint, knip, markdownlint
just fmt             # oxfmt --write
just ci              # audit + fmt + check + lint + build (full pipeline)
just build           # production build
just ta              # run all tests (unit + integration)
just tu              # run unit tests (Vitest, fast mode via VITEST_FAST)
just ti              # run integration tests (Playwright)
just tc              # run unit tests with coverage
```

Pre-commit hooks (via Lefthook) run formatting and linting on staged files.

---

## Directory structure (Feature-Sliced Design)

The project follows a pragmatic Feature-Sliced Design (FSD) approach:

```text
src/
  app.css                      # Design tokens (CSS vars) + .glass + .prose
  app.html                     # HTML shell
  content/                     # *.md files (about.md, blog posts)
  entities/                    # Core business entities
    codeTheme/                 # CodeTheme type
    post/                      # Post type + api.ts (Content loading & validation)
  features/                    # Isolated business-value modules
    background/                # Background orchestration
    engine/                    # WebGPU Engine (Simulation, Passes, Shaders)
    search/                    # FlexSearch integration logic
    theme/                     # Theme management (Dark/Light, Reading Mode)
  widgets/                     # Composition layer
    blog/                      # Blog listing widgets
    landing/                   # Landing page sections
    layout/                    # App shell parts (Nav, Footer)
    post/                      # Post-related widgets
    search/                    # Search UI
    settings/                  # Settings panel
    theme/                     # Theme-related widgets
  lib/                         # Universal libraries
    highlighter.ts             # Shiki setup with Lazy Loading
    math-preprocessor.js       # $...$ → KaTeX HTML preprocessor
  routes/                      # SvelteKit Routing
    +layout.svelte             # App shell
    +page.svelte               # Landing page
    blog/                      # Blog listing and individual post renderer
  shared/                      # Truly universal code
    config/site.ts             # Central source of truth (nav, themes, author info, etc.)
    lib/actions/               # Svelte actions
    ui/                        # Reusable primitives (CodeBlock, CodeTabs, MathCopy)
tests/
  setup.ts                     # Vitest setup
  playwright/                  # E2E specs
```

### Path aliases

| Alias       | Resolves to    |
| ----------- | -------------- |
| `$features` | `src/features` |
| `$shared`   | `src/shared`   |
| `$entities` | `src/entities` |
| `$widgets`  | `src/widgets`  |
| `$lib`      | `src/lib`      |

---

## State Management (Svelte 5)

We **DO NOT** use Svelte 4 `writable` stores.
State is managed using Svelte 5 Runes (`$state`, `$derived`, `$effect`) encapsulated within TypeScript files (usually `.svelte.ts`) in the `model/` directories or as standalone files.

Example:

```typescript
class ThemeState {
  #current = $state<Theme>('dark');
  get current() {
    return this.#current;
  }
  toggle() {
    /* ... */
  }
}
export const theme = new ThemeState();
```
