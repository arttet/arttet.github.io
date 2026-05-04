---
title: Infrastructure
description: CI/CD pipeline, deploy targets, observability, secrets, environment variables.
status: active
last_updated: 2026-05-04
purpose: Pipeline stages, deploy targets, observability, secrets.
related:
  - ./workflow.md
  - ./testing.md
  - ./troubleshooting.md
  - ../architecture/markdown-pipeline.md
---

# Infrastructure <Badge type="warning" text="beta" />

GitHub Actions is the only deployment forge. Every push and pull request runs the full pipeline; main-branch pushes additionally trigger production deploys to GitHub Pages and three Cloudflare Pages projects.

## Pipeline Stages

Defined in `.github/workflows/ci.yml`. Stages run in order; a failure in any stage blocks all subsequent stages and the merge.

| #   | Job        | Tools                                                                       | Fails on                                           |
| --- | ---------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | Audit      | Trivy fs scan, Semgrep (typescript), dependency-review                      | secret/misconfig, high-severity rules, banned deps |
| 2   | Lint       | oxfmt, oxlint, svelte-check, stylelint, knip, markdownlint, cspell, eslint  | any non-zero exit                                  |
| 3   | Build      | `vite build` with `ANALYZE=true` (emits `target/stats.html` + `stats.json`) | type errors, broken imports                        |
| 4   | Playwright | matrix: `chrome-{desktop,mobile}`, `firefox-{desktop,mobile}`               | spec failure or visual regression                  |
| 5   | Lighthouse | LHCI on `chrome-desktop` and `chrome-mobile`                                | perf / a11y / best-practices / SEO < 0.9           |
| 6   | Coverage   | Vitest v8                                                                   | < 90% global                                       |
| 7   | Bundle     | `bundle-report.mjs` vs `misc/bundle-baseline.json`                          | size regression                                    |

## Deploy Targets

| Target                          | URL                         | Trigger        |
| ------------------------------- | --------------------------- | -------------- |
| GitHub Pages (app)              | `arttet.github.io`          | push to `main` |
| Cloudflare Pages (app, preview) | `<pr>.arttet-app.pages.dev` | pull request   |
| Cloudflare Pages (app, prod)    | `arttet.dev`                | push to `main` |
| Cloudflare Pages (infra)        | `infra.arttet.dev`          | push to `main` |
| Cloudflare Pages (docs)         | `docs.arttet.dev`           | push to `main` |

PR sticky comment aggregates: app preview link, docs preview link, infra-report links (Playwright HTML report, Lighthouse report, bundle report).

## Cloudflare Provisioning

Cloudflare Pages projects are managed via Wrangler. Project setup commands live in `misc/justfiles/deployment.just`:

```sh
just deploy list           # list CF Pages projects in the account
just deploy create <name>  # provision a new project
just deploy delete <name>  # remove a project
```

## Observability

- **Codecov**: every Vitest run uploads coverage; PR comment posts delta.
- **Lighthouse CI**: HTML report is bundled into `infra.arttet.dev` and linked in the PR sticky comment.
- **Bundle baseline**: `misc/bundle-baseline.json` — update via `just bb` after intentional growth, then commit the new baseline alongside the change that caused it.
- **Bundle report**: `bundle-report.mjs` writes a markdown summary uploaded to `infra.arttet.dev`.

## Secrets

Stored in **Settings → Secrets and variables → Actions** at the repository level:

| Secret                  | Purpose                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Wrangler deploy auth (token must have Cloudflare Pages: Edit)    |
| `CLOUDFLARE_ACCOUNT_ID` | CF account scope                                                 |
| `CODECOV_TOKEN`         | Coverage upload (required for private repos; optional otherwise) |
| `LHCI_GITHUB_APP_TOKEN` | Lighthouse PR status check                                       |

Secrets are referenced by name in workflow YAML (`$\{\{ secrets.CLOUDFLARE_API_TOKEN \}\}`). Never inline.

## Local pipeline parity

`just ci` runs the local equivalent of stages 1-3 (audit + fmt + check + spell + lint + build). For full parity including matrix Playwright and Lighthouse, run them under Docker:

```sh
just baseline ci         # Docker-pinned Playwright snapshot update (Linux/chrome-desktop)
just test lhci           # local Lighthouse run
just test bundle         # bundle baseline check
```

## Related

- [Engineering Workflow](./workflow.md)
- [Testing Strategy](./testing.md)
- [Troubleshooting](./troubleshooting.md)
- [Markdown Pipeline](../architecture/markdown-pipeline.md)
