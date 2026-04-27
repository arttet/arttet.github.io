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

Pre-commit hooks (via Lefthook) run formatting and linting on staged files.
`commit-msg` hook validates conventional commit format via commitlint.
`pre-push` hook runs gitleaks against staged content.

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

## AI Agent Guardrails

- **Code Coverage**: Must be **90%+**. All new features and bugfixes MUST include unit or E2E tests.
- **Svelte 5**: Use exclusively Svelte 5 Runes (`$state`, `$props`, `$derived`, `$effect`). DO NOT use Svelte 4 syntax (`export let`, `$:`, etc.).
- **Tailwind CSS v4**: Configuration is done via `@theme` in `src/app.css`. DO NOT look for or create `tailwind.config.js`.
- **Feature-Sliced Design (FSD)**: Strict unidirectional dependencies. Lower layers (`shared`, `entities`) CANNOT import from upper layers (`features`, `widgets`, `app`).
- **Package Manager**: Use ONLY `bun` (`bun add`, `bun run`). DO NOT use `npm`, `yarn`, or `pnpm`.
- **Formatting & Linting**: Managed by Oxc (`oxfmt`, `oxlint`). DO NOT use or add `Prettier`.
- **Graphics**: The engine uses WebGPU and WGSL. DO NOT use WebGL, Three.js, or GLSL.
- **Testing**: Playwright is used for E2E. DO NOT use Cypress or Selenium.
- **Typing**: Strict TypeScript. DO NOT use `any`.
