# AGENTS.md — Project Context for AI Agents

## Objective

Minimize token usage while maximizing signal-to-noise ratio in all AI interactions.
Agents MUST prefer concise, structured, and minimal-context responses.

---

## Global Rules

1. Do NOT request or output full files unless explicitly required.
2. Always operate on the smallest possible context.
3. Prefer diffs, patches, or snippets over full rewrites.
4. Avoid repetition of user-provided content.
5. No explanations unless explicitly requested.
6. Default response style: concise, technical, actionable.

---

## Input Contract (User → Agent)

All requests SHOULD follow this structure:

Context:
<1–2 lines max>

Goal:
<desired outcome>

Problem:
<error / symptom>

Scope:
<what to analyze, explicitly limited>

Artifacts:
<only relevant code / logs>

Constraints:
(optional)

### Token Optimization Rules

- **NEVER include:** full logs, lockfiles, generated files.
- Logs MUST be truncated to the last ~50 lines.
- Code MUST be a minimal reproducible snippet.
- Prefer references over duplication.

### Code Modification Rules

- Prefer unified diff format.
- Do NOT reformat unrelated code.
- Do NOT rename unless required.
- Preserve existing architecture.

### Anti-Patterns (Forbidden)

- "Here is the full updated file…"
- Repeating user input.
- Long theoretical explanations.
- Overengineering solutions.
- Guessing outside defined Scope.

### DEEP ANALYSIS MODE

- **Trigger:** "deep"
- **Response:** Detailed reasoning, tradeoffs, alternatives.

**Priority:** Correctness > Brevity > Completeness.
_Minimal tokens WITHOUT losing correctness is the goal._

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

```sh
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

Git hooks (Lefthook):

- `pre-commit`: `oxfmt`, `oxlint`, `stylelint`, `markdownlint`, `audit`.
- `commit-msg`: `commitlint`.
- `pre-push`: `gitleaks`.

---

## Sprint workflow

Work is organized into **sprints**, each broken into **iterations**. One iteration = one pull request.

### Iteration loop

1. **Plan** — agent proposes scope, lists files to touch.
2. **Implement** — agent edits files only. No git, no shell, no `bun`/`just`/`gh`.
3. **Hand off command list** — agent prints the exact git/gh commands the user will run, in a code block, with no commentary mixed inside the block.
4. **User runs** — `just ci`, `just ta`, then the supplied `git add` / `git commit` / `git push` / `gh pr create`.
5. **Feedback** — user reports test/CI status. If anything fails, agent iterates on the same branch (force-push with `--force-with-lease`).
6. **Merge** — once green, user merges the PR. Only then does the next iteration start.

### Command-list shape

A PR has one or more **Changes** (labeled A, B, C, …). Each Change = one logical commit on the PR branch.

Per Change, the agent emits:

```sh
git add <file1> <file2> ...
git commit -m "<type>(<scope>): <subject>"
```

Once at the start of each PR (before Change A):

```sh
just ci
just ta
git checkout main
git pull --rebase
git checkout -b <branch>
```

Once at the end (after the last Change):

```sh
git push -u origin <branch>
gh pr create --fill
```

For follow-up pushes after review-driven amends or rebase: `git push --force-with-lease`.

### Conventions

- **Conventional Commits** are required (`feat`, `fix`, `chore`, `ci`, `docs`, `refactor`, `test`, `perf`, `build`, `style`, `revert`); enforced by commitlint in the `commit-msg` hook.
- **Branch names** follow `<type>/<short-slug>`: `fix/toc-rescan-on-nav`, `ci/gitleaks`, `test/post-ux-snapshots`.
- **Plans** for non-trivial sprints are committed at `.ai/plans/<YYYY-MM-DD>-<slug>.md` in their own PR before implementation begins.

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

## AI Agent Guardrails & Code Style

- **Code Coverage**: Must be **90%+**. All new features and bugfixes MUST include unit or E2E tests.
- **Svelte 5**: Use exclusively Svelte 5 Runes (`$state`, `$props`, `$derived`, `$effect`). DO NOT use Svelte 4 syntax (`export let`, `$:`, etc.). No Svelte 4 stores for new code. Avoid `// biome-ignore` unless a `$state` variable must be reassigned.
- **Tailwind CSS v4**: Configuration is done via `@theme` in `src/app.css`. DO NOT look for or create `tailwind.config.js`.
- **Feature-Sliced Design (FSD)**: Strict unidirectional dependencies. Lower layers (`shared`, `entities`) CANNOT import from upper layers (`features`, `widgets`, `app`).
- **Package Manager**: Use ONLY `bun` (`bun add`, `bun run`). DO NOT use `npm`, `yarn`, or `pnpm`.
- **Code Style**:
  - **Indent**: tabs · **Line width**: 100 · **Quotes**: single · **Trailing commas**: es5 · **Semicolons**: always.
- **Formatting & Linting**: Managed by Oxc (`oxfmt`, `oxlint`). `noNonNullAssertion` → warn, `no-console` → warn. DO NOT use or add `Prettier`.
- **Graphics**: The engine uses WebGPU and WGSL. DO NOT use WebGL, Three.js, or GLSL.
- **Testing (Playwright E2E)**: Base URL: `http://localhost:4173`. Project order: `landing` (`homepage.spec.ts`) runs first; `chromium` depends on it and runs all other specs. DO NOT use Cypress or Selenium.
- **Typing**: Strict TypeScript. DO NOT use `any`.

---

## Key Files & Configuration

- `src/shared/config/site.ts` — single source of truth for all site-wide config (nav links, particle settings, nav hide threshold).
- `src/app.css` — design tokens (CSS vars), `.glass`, `.mesh-gradient`, `.prose` classes.
- `src/lib/content.ts` / `src/entities/post/api.ts` — `getPosts()` / `getPost(slug)` via `import.meta.glob`.
- `src/features/theme/theme.ts` — Svelte store for theme management, persists to `localStorage`, toggles `.dark` on `<html>`. Theme switch uses `document.startViewTransition()` with a circular `clip-path` reveal.

---

## Core UI Components (`src/shared/ui/`)

When building new features, use these ready-made primitives instead of creating custom ones:

- **`CodeBlock.svelte`**: Syntax-highlighted code block (via Shiki) with an integrated copy button.
  - Props: `code: string`, `lang?: string`.
- **`CodeTabs.svelte`**: Tabbed code block interface for showing multiple files/languages.
  - Props: `tabs: Array<{ lang: string; label: string; code: string }>`.
- **`CopyButton.svelte`**: A highly accessible copy-to-clipboard button with visual feedback (check icon).
  - Props: `content: string`, `label?: string`, `inline?: boolean`.
- **`MathCopy.svelte`**: Renders KaTeX math equations (inline or block) with an integrated copy button for the original LaTeX source.
  - Props: `b64Latex: string`, `b64Html: string`, `display?: boolean`.
- **`Seo.svelte`**: Reusable component for injecting meta tags, Open Graph tags, JSON-LD, and Twitter cards.
  - Props: `title?: string`, `description?: string`, `type?: string`, `url?: string`, `image?: string`, `publishedTime?: string`, `modifiedTime?: string`, `tags?: string[]`.

---

## Core Pipelines

### 1. Markdown & Content Pipeline (`.md` files)

The project uses a highly customized `mdsvex` pipeline to render Markdown into Svelte components:

- **Content Model**: Blog posts live in `src/content/blog/*.md` with YAML frontmatter: `title`, `tags`, `created` (ISO 8601), `summary`, `draft`.
- **Preprocessing Chain**: `mathPreprocess` → `vitePreprocess` → `mdsvex`.
- **Custom Preprocessor (`src/lib/math-preprocessor.js`)**: Runs _before_ mdsvex.
  - Intercepts `$$...$$` (display) and `$...$` (inline) math and statically renders them using KaTeX. It automatically injects the `<MathCopy>` component and `<KaTeXStyles>`.
  - Intercepts `:::code-tabs` blocks and transforms them into `<CodeTabs>` Svelte components.
- **Mdsvex & Shiki (`mdsvex.config.js`)**:
  - Standard code blocks are statically highlighted at build time using `shiki`.
  - `mermaid` language blocks (e.g. ` ```mermaid `) are base64-encoded and wrapped in a specific DOM structure to be rendered client-side.
  - A custom remark plugin calculates and injects `readingTime` into the frontmatter.
    **Rule:** DO NOT add client-side markdown parsers or math rendering libraries. Everything is pre-rendered at build time.

### 2. WebGPU Engine Pipeline (`src/features/engine/` & `src/features/background/`)

The background graphics are powered by a custom WebGPU compute and render engine. Orchestrated via `src/features/background/ui/BackgroundCanvas.svelte`.

- **Data Structure**: Two classes control this: `BackgroundRenderer` (WebGPU init, RAF) and `Simulation` (CPU particle physics + Delaunay edges). Simulation STRIDE = 8: `[x, y, vx, vy, r, g, b, alpha]`. Delaunay is recomputed every 3 frames via `d3-delaunay`. Edges are filtered by `maxDist` (default 150 px).
- **Shaders (`src/features/engine/shaders/`)**: Written exclusively in WGSL (`.wgsl`). Key shaders: `particles.wgsl`, `edges.wgsl`, `triangles.wgsl`. DO NOT write GLSL.
- **Core (`src/features/engine/core/`)**: GPU buffers are updated CPU→GPU every frame via `device.queue.writeBuffer`. The Canvas format uses `alphaMode: 'premultiplied'`.
- **Passes (`src/features/engine/passes/`)**: Render order per frame:
  1. **Edge pass** — instanced triangle-strip quads, one instance per Delaunay edge (additive blend).
  2. **Particle pass** — instanced point-sprite quads (additive blend).
     **Rule:** When adding a new visual effect, create a new Pass class and its corresponding WGSL shader. Do not use Canvas2D or WebGL.
