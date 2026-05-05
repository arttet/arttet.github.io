---
title: Architecture Overview
status: active
last_updated: 2026-05-04
purpose: System map, FSD layering, and the canonical Directory Structure for the whole repo.
related:
  - ./markdown-pipeline.md
  - ./webgpu-pipeline.md
  - ./search-engine.md
  - ./style-design.md
  - ../developer/index.md
---

# Architecture Overview <Badge type="warning">beta</Badge>

[arttet.dev](https://arttet.dev) is a static SvelteKit app fed by an AST-first markdown compiler, augmented by a WebGPU particle background and a build-time FlexSearch index. Design tokens live in `src/app.css`. Subsystems are independent and composable; imports flow `shared → entities → features → widgets → routes`.

## Subsystems

| Subsystem                                      | Source                                                | Doc                                            |
| ---------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| Markdown compiler (AST-first, deterministic)   | `config/mdsvex/`                                      | [markdown-pipeline.md](./markdown-pipeline.md) |
| WebGPU particle background                     | `src/features/background/`, `src/features/engine/`    | [webgpu-pipeline.md](./webgpu-pipeline.md)     |
| Search (FlexSearch, build-time index)          | `src/features/search/`, `src/routes/api/search.json/` | [search-engine.md](./search-engine.md)         |
| Style design (Tailwind v4 tokens, glass, mesh) | `src/app.css`, `src/shared/styles/`                   | [style-design.md](./style-design.md)           |

## Layer responsibilities (FSD)

Imports flow upward only.

| Layer      | Path            | Responsibility                                               |
| ---------- | --------------- | ------------------------------------------------------------ |
| `shared`   | `src/shared/`   | UI primitives, config, styles, utils — used everywhere       |
| `entities` | `src/entities/` | Domain models, thin UI (post, codeTheme)                     |
| `features` | `src/features/` | Independent capabilities (background, engine, search, theme) |
| `widgets`  | `src/widgets/`  | Page-level compositions assembled from features/entities     |
| `routes`   | `src/routes/`   | SvelteKit file-system routes — thin shells                   |
| `lib`      | `src/lib/`      | Cross-cutting utilities not tied to FSD layers               |

## Key files

- `src/shared/config/site.ts` — site config (nav, author, particles, theme defaults).
- `src/app.css` — design tokens, `.glass`, `.mesh-gradient`, `.prose`.
- `svelte.config.js` — preprocess order: `markdownPreprocess → vitePreprocess → mdsvex`.
- `vite.config.ts` — build config, chunking left to Rollup defaults.
- `mdsvex.config.js` — delegates to `config/mdsvex/index.js`.
- `config/mdsvex/registry.js` — markdown-allowed component whitelist.

## Directory Structure <Badge type="warning">beta</Badge>

This is the **canonical** layout of the repository. All other documents that need to reference structure must link here, not reproduce it.

::: tip Update Structure

If the structure below becomes outdated, you can regenerate it using `eza`:

```sh
eza --tree --level=5 --git-ignore --icons=never --color=never
```

:::

```txt
arttet.github.io/
├── AGENTS.md                       # AI contract — pointer to docs/platform/developer/
├── CLAUDE.md                       # Claude Code pointer (mirror of AGENTS.md)
├── README.md
├── justfile                        # mod docs / test / baseline / deploy / pr
├── lefthook.yml                    # pre-commit + commit-msg hooks
├── package.json                    # root scripts (build/dev/test/docs:*)
├── playwright.config.ts            # local: chrome-desktop only
├── playwright.ci.config.ts         # CI: chrome+firefox × desktop+mobile
├── svelte.config.js                # preprocess: markdownPreprocess → vite → mdsvex
├── vite.config.ts
├── mdsvex.config.js                # delegates to config/mdsvex/index.js
├── tsconfig.json
├── .gitignore | .oxlintrc.json | .stylelintrc.json | .lighthouserc.json | knip.json | cspell.json | codecov.yml | eslint.config.js | commitlint.config.js
├── bun.lock
│
├── .github/
│   └── workflows/                  # ci.yml
│
├── config/
│   └── mdsvex/
│       ├── engine/                 # pass-groups.js, context, diagnostics, registry
│       ├── passes/                 # content, optimization, security passes
│       ├── build/                  # frontmatter-schema, manifest, scan, filter, artifacts
│       └── registry.js             # markdown-allowed component whitelist
│
├── content/
│   ├── blog/YYYY/                  # YYYY-MM-DD-slug.md posts
│   └── pages/                      # static markdown pages
│
├── docs/                           # VitePress site (deployed to docs.arttet.dev)
│   ├── .vitepress/config.mts       # sidebar + nav config
│   ├── package.json                # vitepress deps
│   ├── index.md                    # home (Hero + features)
│   ├── public/
│   │   └── logo.svg                # site logo
│   ├── platform/
│   │   ├── writer/                 # content-author docs
│   │   ├── developer/              # engineer + AI agent docs
│   │   └── architecture/           # subsystem internals (this folder)
│   └── evolution/
│       ├── workflow.md
│       ├── rfc/                    # NNNN-slug.md proposals
│       └── adr/                    # NNNN-slug.md accepted decisions
│
├── misc/
│   ├── bundle-baseline.json
│   ├── justfiles/                  # docs.just / deployment.just / testing.just / …
│   └── templates/
│       └── post.md.template        # scaffold template for `just new`
│
├── operations/                     # Engineering OS (in git, not deployed)
│   ├── inbox/                      # raw ideas
│   ├── activities/YYYY/MM/         # all work, single source of truth
│   ├── dashboards/
│   │   └── kanban.md               # Obsidian Kanban (To Do / In Progress / Done)
│   └── templates/
│       ├── activities.md
│       └── rfc.md
│
├── operations.local/               # personal scratch (NOT in git, see .gitignore)
│
├── scripts/                        # serve-static.ts, run-lhci.mjs, bundle-report.mjs, assemble-infra-pages.mjs, build-preview-comment.mjs, detect-run-artifacts.mjs
│
├── src/                            # SvelteKit app (FSD layered)
│   ├── app.css                     # @theme tokens, .glass, .mesh-gradient, .prose
│   ├── app.html                    # HTML shell + theme-avoid-flash inline script
│   ├── routes/                     # file-system routes
│   ├── widgets/                    # blog, landing, layout, post, search, settings, theme (UI compositions)
│   ├── features/                   # background (shaders, simulation), search, theme
│   ├── entities/                   # post, codeTheme (with UI)
│   ├── shared/                     # ui, config, styles, lib (actions, utils, webgpu)
│   └── lib/                        # cross-cutting (markdown, assets)
│
├── static/                         # static assets
│   └── robots.txt
│
├── target/                         # build outputs (gitignored)
│   ├── build/                      # static site
│   ├── generated/                  # content-manifest.json, diagnostics.{md,json}, knowledge-graph.json
│   ├── coverage/                   # Vitest v8 coverage
│   ├── playwright-report/
│   └── test-results/
│
└── tests/
    ├── markdown/                   # markdown preprocessor tests
    ├── playwright/                 # Playwright specs (homepage runs first)
    └── setup.ts                    # Vitest mocks (Shiki, WebGPU, localStorage, …)
```

## Related

- [Markdown Pipeline](./markdown-pipeline.md)
- [WebGPU Pipeline](./webgpu-pipeline.md)
- [Search Engine](./search-engine.md)
- [Design System](./style-design.md)
- [Developer Guide](../developer/index.md)
