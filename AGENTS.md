# AGENTS.md — Project Context for AI Agents

Personal blog and portfolio of Artyom Tetyukhin.
Static site (Svelte 5 + SvelteKit + Tailwind 4), deployed to GitHub Pages.

---

## Stack

| Layer                | Choice                                                                            |
| -------------------- | --------------------------------------------------------------------------------- |
| Framework            | Svelte 5 (Runes), SvelteKit 2 (adapter-static)                                    |
| Bundler              | Vite 8, Bun (package manager)                                                     |
| Styling              | Tailwind CSS v4 + custom CSS variables (`app.css`)                                |
| Graphics Engine      | WebGPU (Compute & Render pipelines) + d3-delaunay                                 |
| Content              | mdsvex (Markdown → Svelte), Shiki (lazy-loaded syntax highlighting), KaTeX (math) |
| Search               | FlexSearch                                                                        |
| Linting & Formatting | Oxfmt, OXlint, Stylelint, Markdownlint                                            |
| Testing              | Vitest + Testing Library (Unit), Playwright (E2E)                                 |

---

## Commands

```bash
bun run dev          # dev server → http://localhost:5173
bun run build        # production build → build/ (generates stats.html via visualizer)
bun run preview      # preview build → http://localhost:4173
bun run check        # svelte-check type-check
bun run test:unit    # Vitest unit tests
just lint            # oxfmt, oxlint, stylelint, markdownlint, knip
just fmt             # oxfmt --write
just ci              # fmt + lint + build (full pipeline)
just build           # check + test-unit + bun run build (safe build)
just test            # build + playwright run
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
    post/                      # Post type
  features/                    # Isolated business-value modules
    background/
      core/                    # BackgroundScene.ts (WebGPU orchestration)
      ui/                      # BackgroundCanvas.svelte, BackgroundModeList.svelte
      backgroundMode.svelte.ts # State for active background mode
    engine/                    # WebGPU Engine
      core/                    # GPUContext.ts, Simulation.ts, MarchingSquares.ts
      passes/                  # Render passes (Particles, Contours, Flow, Composite)
      shaders/                 # *.wgsl compute and render shaders
    landing/                   # Landing page specific UI (HeroOverlay, LandingCanvas)
    search/                    # FlexSearch integration and CommandPalette UI
    theme/                     # Theme management (Dark/Light, Reading Mode, Code Themes)
      model/                   # Class-based Rune states (theme, codeTheme, readingMode)
      ui/                      # Highly decoupled UI components (SettingsPanel, ThemeToggle, etc.)
  lib/                         # Universal libraries
    content.ts                 # Markdown glob loader, reading time calc
    highlighter.ts             # Shiki setup with Lazy Loading per language
    math-preprocessor.js       # $...$ → KaTeX HTML, runs before mdsvex
  routes/                      # SvelteKit Routing
    +layout.svelte             # App shell (Nav, Footer, CommandPalette, CodeThemeSync)
    +page.svelte               # Landing page
    blog/                      # Blog listing and individual post renderer ([slug])
    ...xml/+server.ts          # RSS/Atom feed generators
  shared/                      # Truly universal code
    config/site.ts             # Central source of truth (nav, themes, author info)
    lib/actions/               # Svelte actions (e.g., clickOutside)
    ui/                        # Reusable primitives (CodeBlock, CodeTabs, MathCopy)
tests/
  setup.ts                     # Vitest setup (jest-dom)
  playwright/                  # E2E specs
```

### Path aliases

| Alias       | Resolves to    |
| ----------- | -------------- |
| `$features` | `src/features` |
| `$shared`   | `src/shared`   |
| `$entities` | `src/entities` |
| `$lib`      | `src/lib`      |

---

## State Management (Svelte 5)

We **DO NOT** use Svelte 4 `writable` stores.
State is managed using Svelte 5 Runes (`$state`, `$derived`, `$effect`) encapsulated within TypeScript classes in the `model/` directories.

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

UI components (in `ui/`) import these singleton instances and react to them automatically. We favor composition (many small components) over monolithic panels.

---

## WebGPU Graphics Engine (`src/features/engine/`)

The background effects are entirely GPU-accelerated using WebGPU.

- **`Simulation.ts`**: Runs particle physics (CPU-side for now, managing positions, velocities, and Delaunay triangulation).
- **Passes (`passes/`)**: Implement specific visual modes (`ParticlesPass`, `ContoursPass`, `FlowPass`).
- **`CompositePass.ts`**: Handles post-processing, including the "glass" refraction effect over the background.
- **Shaders (`shaders/`)**: Written in WGSL (`.wgsl`).

The engine is orchestrated by `BackgroundScene.ts` in the `background` feature.

---

## Content Model & Rendering

- **Format**: Markdown (`.md`) with YAML frontmatter.
- **Loading**: `import.meta.glob` in `src/lib/content.ts` reads posts, calculates reading time, and sorts them.
- **Processing**:
  1. `mathPreprocess` (Custom): Converts `$` and `$$` to `<MathCopy>` components before mdsvex.
  2. `mdsvex`: Converts Markdown to Svelte components.
  3. `highlighter.ts`: Uses Shiki for syntax highlighting. **Languages are lazy-loaded** dynamically in `CodeBlock.svelte` to minimize the main bundle size.
- **Themes**: Code blocks support dynamic theme switching via CSS variables injected by `CodeThemeSync.svelte`.

---

## Design System (`src/app.css`)

Built with Tailwind CSS v4 and custom CSS variables.

- **Dark Mode First**: Tokens defined in `@theme`, light mode overrides in `html:not(.dark)`.
- **Cosmic Glass**: The `.glass` utility provides a complex, multi-layered backdrop filter and shadow effect to simulate liquid glass over the WebGPU canvas.
- **Typography**: Handled by the `.prose` class for blog posts.

---

## Tooling & Workflow

- **Build Pipeline**: `just build` is the Bun-first gatekeeper. It runs type checking and unit tests before executing the Vite production build.
- **Bundle Analysis**: `rollup-plugin-visualizer` is integrated into `vite.config.ts`. Running a build generates `stats.html` in the project root.
- **CI**: `just ci` runs formatting, linting, and the full safe build pipeline.
- **Testing**:
  - Components/Logic: Tested with Vitest (`src/**/*.test.ts`).
  - E2E: Tested with Playwright (`tests/playwright/`).
