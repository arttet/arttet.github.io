---
title: Troubleshooting
status: active
last_updated: 2026-05-04
purpose: Common failures and how to fix them — local dev, content, tests, CI.
related:
  - ./infrastructure.md
  - ./testing.md
  - ../architecture/markdown-pipeline.md
---

# Troubleshooting <Badge type="tip" text="v1" />

Failure mode → cause → fix. Read your CI artifact (`diagnostics.md`) before asking — most build failures are content errors, not code bugs.

## Local Dev

### Vite: MIME type blocking (`text/html`)

**Symptom**: `Loading module from "..." was blocked because of a disallowed MIME type ("text/html")`.
**Cause**: Missing `index.md` in a directory you tried to navigate to. VitePress falls back to `index.html` on 404, browsers reject for module imports.
**Fix**: Ensure every folder under `docs/` has an `index.md`.

### Bun install fails on Windows symlinks

**Symptom**: `EPERM` or symlink errors during `bun install`.
**Cause**: Developer Mode disabled on Windows.
**Fix**: Settings → For developers → Developer Mode ON, restart terminal, retry.

### Lefthook hooks not firing

**Symptom**: Commits succeed without formatting/linting.
**Fix**: `bunx lefthook install` after a fresh clone.

### svelte-check reports phantom errors after schema change

**Symptom**: `svelte-check` complains about types that look correct.
**Fix**: `bun run check` runs `svelte-kit sync` first; if you ran `svelte-check` directly, run `svelte-kit sync` once.

## Content / Markdown

### Markdown diagnostics (`MDX***`)

**Symptom**: Build fails with an `MDX***` code.
**Cause**: The markdown pipeline enforces strict mode in CI (warn mode locally).
**Fix**: Read `target/generated/diagnostics.md` — it has `file:line:column` for every diagnostic. See the [diagnostics schema in markdown-pipeline.md](../architecture/markdown-pipeline.md).

→ Full code reference: [frontmatter.md → Diagnostic Codes](../writer/frontmatter.md#diagnostic-codes).

### Diagnostic JSON / MD divergence

**Symptom**: `target/generated/diagnostics.md` shows different errors than `diagnostics.json`.
**Cause**: Stale build artifact — `vite build` uses incremental cache.
**Fix**: `just clean && just build`.

## Tests

### Playwright snapshot mismatch

**Symptom**: `expect(page).toHaveScreenshot()` fails on a spec that was previously green.
**Cause**: UI change OR cross-OS font rendering differences.
**Fix**: If intentional → `just bs` (current OS) or `just baseline ci` (Linux/Docker for CI parity). If not intentional, investigate the diff in `target/test-results/`.

### Vitest hangs on WebGPU spec

**Symptom**: Test never completes when touching `src/features/background/`.
**Cause**: WebGPU mocks not loaded.
**Fix**: Ensure `tests/setup.ts` is in `vitest.config` setupFiles. Run with `VITEST_FAST=true` to skip background UI tests temporarily.

### Coverage drops below 90% after refactor

**Symptom**: CI coverage stage fails after a refactor that didn't add new code paths.
**Fix**: Coverage exclusions live in `vite.config.ts` — newly created `index.ts` re-exports may have been picked up. Verify the exclusion list still covers your barrel files.

## CI

### Bundle budget exceeded

**Symptom**: `bundle-report` step fails with size delta > baseline.
**Cause**: New dependency or large asset.
**Fix**: Inspect `target/stats.html`. If growth is intentional → `just bb` to update baseline, commit `misc/bundle-baseline.json` in the same PR.

### Lighthouse < 0.9 on a pillar

**Symptom**: LHCI red on perf / a11y / SEO / best-practices.
**Fix**: Open the LHCI artifact (linked in PR sticky comment). Common causes: oversized hero image (sharp not invoked), missing `alt` on a new image, render-blocking script.

### Cloudflare Pages preview missing

**Symptom**: PR sticky comment doesn't include CF preview link.
**Cause**: Wrangler auth failure or project not provisioned.
**Fix**: Verify `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets. Run `just deploy list` locally to confirm the project exists. If missing → `just deploy create <name>`.

### Snapshot tests differ between local and CI

**Symptom**: Local Playwright passes, CI fails with snapshot mismatch.
**Cause**: Snapshots were captured on a different OS/browser version.
**Fix**: `just baseline ci` runs Playwright in the CI Docker image (Linux/chrome-desktop) and updates snapshots accordingly. Commit the new baselines.

<!-- AGENT_CONTEXT
MDX diagnostic codes are single-source-of-truth in config/mdsvex/constants.js (DIAGNOSTIC_CODES).
If you add, rename, or remove a code, you MUST update:
  - config/mdsvex/constants.js
  - docs/platform/developer/troubleshooting.md (this file)
  - docs/platform/writer/frontmatter.md (if frontmatter-related)

Codes are emitted by these files:
  - Security:    config/mdsvex/passes/security/security-guards.js
  - Frontmatter: config/mdsvex/passes/content/frontmatter.js
  - Images:      config/mdsvex/passes/content/images.js
  - Headings:    config/mdsvex/passes/content/headings.js
  - Links:       config/mdsvex/passes/content/links.js
  - Slug guard:  config/mdsvex/build/filter.js
  - Scan:        config/mdsvex/build/scan.js
-->

## Related

- [Infrastructure](./infrastructure.md)
- [Testing Strategy](./testing.md)
- [Markdown Pipeline](../architecture/markdown-pipeline.md)
