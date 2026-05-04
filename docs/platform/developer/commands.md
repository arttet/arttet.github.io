---
title: Commands Reference
status: active
last_updated: 2026-05-04
purpose: Authoritative list of CLI commands — just, bun, gh, wrangler.
related:
  - ./workflow.md
  - ./testing.md
  - ./infrastructure.md
---

# Commands Reference <Badge type="tip" text="v1" />

`just` orchestrates everything. `bun` runs scripts and installs dependencies. `npm`, `yarn`, and `pnpm` are forbidden — `bun.lock` integrity depends on it.

## Just

The root `justfile` chains submodules: `mod docs`, `mod test`, `mod baseline`, `mod deploy`, `mod pr`. List recipes: `just --list` (all) or `just --list docs` (per submodule).

### Development

| Command        | What                                                       |
| -------------- | ---------------------------------------------------------- |
| `just dev`     | Vite dev server                                            |
| `just build`   | Production static build → `target/build/`                  |
| `just preview` | Serve production build                                     |
| `just check`   | svelte-check + oxfmt --check + lefthook validate           |
| `just lint`    | oxlint + stylelint + knip + eslint                         |
| `just fmt`     | oxfmt --write + just --fmt                                 |
| `just spell`   | cspell + markdownlint --fix                                |
| `just ci`      | audit + fmt + check + spell + lint + build (full local CI) |
| `just clean`   | Remove `target/`, `.svelte-kit/`, `node_modules/`          |

### Testing

| Command            | What                                                             |
| ------------------ | ---------------------------------------------------------------- |
| `just tu`          | Fast unit tests (`VITEST_FAST=true`)                             |
| `just ti`          | Playwright integration tests (local, chrome-desktop)             |
| `just tc`          | Vitest with v8 coverage                                          |
| `just ta`          | All tests: unit + integration + coverage                         |
| `just test lhci`   | Lighthouse CI                                                    |
| `just test bundle` | Bundle budget check                                              |
| `just bs`          | Update Playwright snapshots (current OS)                         |
| `just baseline ci` | Update snapshots via Docker (Linux/chrome-desktop for CI parity) |
| `just bb`          | Update bundle baseline (`misc/bundle-baseline.json`)             |

### Authoring

| Command                 | What                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `just new "Post Title"` | Scaffold blog post in `content/blog/YYYY/<date>-<slug>.md` |

### Docs (this site)

| Command             | What                                  |
| ------------------- | ------------------------------------- |
| `just docs dev`     | VitePress dev server                  |
| `just docs build`   | Build docs to `docs/.vitepress/dist/` |
| `just docs preview` | Preview built docs                    |

### Deploy (Cloudflare Pages)

| Command                     | What                                   |
| --------------------------- | -------------------------------------- |
| `just deploy list`          | List CF Pages projects in the account  |
| `just deploy create <name>` | Create new CF Pages project (wrangler) |
| `just deploy delete <name>` | Remove CF Pages project                |

## Bun

| Command                  | What                                                        |
| ------------------------ | ----------------------------------------------------------- |
| `bun install`            | Resolve deps, write/update `bun.lock`                       |
| `bun audit`              | Security advisory scan                                      |
| `bun --cwd docs install` | Install docs-only deps (vitepress)                          |
| `bun run <script>`       | Run npm script from `package.json`                          |
| `bun --bun <cmd>`        | Force Bun runtime when shebang says Node                    |
| `bunx <cli>`             | Execute CLI without global install (used in lefthook hooks) |

**Forbidden**: `npm install`, `yarn install`, `pnpm install` — they break `bun.lock` integrity.

## Direct npm scripts

The same names also work via `bun run <script>` from any directory:

| Script                                     | What                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `dev`                                      | `vite dev`                                                                        |
| `build`                                    | `vite build`                                                                      |
| `preview`                                  | `vite preview`                                                                    |
| `check`                                    | `svelte-kit sync && svelte-check`                                                 |
| `test:unit`                                | Fast unit tests                                                                   |
| `test:unit:coverage`                       | Vitest with v8 coverage                                                           |
| `test:playwright`                          | Playwright (local config)                                                         |
| `test:playwright:production`               | Playwright (CI matrix config)                                                     |
| `test:lhci`                                | `bun scripts/run-lhci.mjs`                                                        |
| `content:diagnostics`                      | `MARKDOWN_DEBUG=true vite build` (emits `target/generated/diagnostics.{md,json}`) |
| `docs:dev` / `docs:build` / `docs:preview` | Delegate to `bun --cwd docs run docs:*`                                           |

## gh (GitHub CLI)

| Command                                 | What                                              |
| --------------------------------------- | ------------------------------------------------- |
| `gh pr create --fill`                   | Create PR using last commit msg as title and body |
| `gh pr comment --body "/gemini review"` | Trigger Gemini review                             |
| `gh pr checks`                          | Live CI status                                    |
| `gh pr view --web`                      | Open PR in browser                                |

## Environment Variables

Variables that affect build, test, and bundle behavior.

| Variable                    | Default  | What it does                                       |
| --------------------------- | -------- | -------------------------------------------------- |
| `ANALYZE`                   | `false`  | Emit `target/bundle/stats.{html,json}` after build |
| `VITEST_FAST`               | `false`  | Skip slow UI specs in Vitest                       |
| `MARKDOWN_DEBUG`            | `false`  | Emit `target/generated/diagnostics.{md,json}`      |
| `BUILD_DIR`                 | `target` | Build output root                                  |
| `BUNDLE_BUDGET_THRESHOLD`   | `0.3`    | Max size delta vs baseline (0.3 = 30%)             |
| `PLAYWRIGHT_SERVER_COMMAND` | —        | Custom server for Playwright                       |
| `PLAYWRIGHT_SERVER_URL`     | —        | Custom server URL for Playwright                   |
| `PLAYWRIGHT_BASE_URL`       | —        | Base URL for Playwright tests                      |

## Markdown component registry

Every Svelte component allowed inside markdown must be registered at `config/mdsvex/registry.js`. New components require both a registry entry and (usually) a new pass — see [extending.md](./extending.md#add-a-markdown-pass).

## Related

- [Engineering Workflow](./workflow.md)
- [Testing Strategy](./testing.md)
- [Infrastructure](./infrastructure.md)
