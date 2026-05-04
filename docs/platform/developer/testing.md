---
title: Testing Strategy
status: active
last_updated: 2026-05-04
purpose: How we test — Vitest unit, Playwright E2E, Lighthouse, coverage targets.
related:
  - ./infrastructure.md
  - ./conventions.md
  - ./troubleshooting.md
---

# Testing Strategy <Badge type="tip" text="v1" />

Three layers: Vitest (unit, jsdom), Playwright (E2E, browser matrix), Lighthouse (perf + a11y). Coverage **≥ 90% global**, **100% on every compiler Pass**. Visual regression runs only on `chrome-desktop` because cross-OS font rendering produces false positives elsewhere.

## Unit (Vitest)

```sh
just tu  # fast unit
just tc  # full + coverage
```

- **Environment**: `jsdom`.
- **Setup**: `tests/setup.ts` mocks Shiki highlighter, WebGPU APIs, `localStorage`, `ResizeObserver`, `IntersectionObserver`.
- **Coverage provider**: v8.
- **Fast mode** (`VITEST_FAST=true`) skips slow UI specs:
  - `src/routes/**/*.svelte.test.ts`
  - `src/shared/ui/**/*.test.ts`
  - `src/widgets/**/ui/*.test.ts`
  - `src/features/background/ui/*.test.ts`
  - `src/widgets/search/ui/*.test.ts`
- **Coverage exclusions**: test files, `.d.ts`, `index.ts` re-exports, app shell, data/interface files.

## Integration / E2E (Playwright)

```sh
just ti           # local Playwright
just bs           # update snapshots (current OS)
just baseline ci  # update snapshots in Docker (Linux parity)
```

- **Local config**: `playwright.config.ts` — chrome-desktop only, webServer via `bun run serve:playwright`.
- **CI config**: `playwright.ci.config.ts` — matrix: chrome-desktop, chrome-mobile, firefox-desktop, firefox-mobile.
- **Spec dependencies**: `tests/e2e/homepage.spec.ts` runs first per browser; other specs depend on it.
- **Visual regression**: `chrome-desktop` only (`tests/e2e/post-ux.spec.ts`).
- **A11y**: `@axe-core/playwright` assertions in `tests/e2e/a11y.spec.ts`.

## Lighthouse

```sh
just test lhci
```

- **Config**: `.lighthouserc.json`.
- **URLs**: `/`, `/blog/`, `/about/`.
- **Asserts**: performance ≥ 0.9, accessibility ≥ 0.9, SEO ≥ 0.9, best-practices ≥ 0.9.
- **Skips**: PWA, HTTPS, and legacy JS audits.

## Test Commands

| What                         | Full command              | Shortcut  |
| ---------------------------- | ------------------------- | --------- |
| Fast unit tests              | `just test unit`          | `just tu` |
| Unit + coverage              | `just test coverage`      | `just tc` |
| Playwright local             | `just test integration`   | `just ti` |
| All tests                    | `just test all`           | `just ta` |
| Lighthouse CI                | `just test lhci`          | —         |
| Bundle budget                | `just test bundle`        | —         |
| Update snapshots (local OS)  | `just baseline snapshots` | `just bs` |
| Update snapshots (CI parity) | `just baseline ci`        | —         |
| Update bundle baseline       | `just baseline bundle`    | `just bb` |

Agents should use **shortcuts** to save tokens. Humans can use full commands for clarity.

## Test Rules

- No code merges without a corresponding test file.
- **Mocks only at system boundaries** (WebGPU, fetch, localStorage). Never mock internal modules.
- Compiler Passes require **100% coverage** — non-negotiable.
- Visual snapshots committed only after manual diff inspection of the failure artifact.

## Where things live

| Kind                    | Path                              |
| ----------------------- | --------------------------------- |
| Vitest setup            | `tests/setup.ts`                  |
| Vitest config           | `vite.config.ts` (vitest section) |
| Playwright local config | `playwright.config.ts`            |
| Playwright CI config    | `playwright.ci.config.ts`         |
| Playwright specs        | `tests/e2e/*.spec.ts`             |
| Lighthouse config       | `.lighthouserc.json`              |
| Lighthouse runner       | `scripts/run-lhci.mjs`            |
| Bundle report           | `scripts/bundle-report.mjs`       |
| Coverage output         | `target/coverage/`                |
| Playwright report       | `target/playwright-report/`       |

## When something breaks

→ [Troubleshooting → Snapshot mismatch](./troubleshooting.md#playwright-snapshot-mismatch).

## Related

- [Infrastructure](./infrastructure.md)
- [Conventions](./conventions.md)
- [Troubleshooting](./troubleshooting.md)
