# My personal blog

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Svelte](https://img.shields.io/badge/Svelte-FF3E00?style=flat&logo=svelte&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white)
![WebGPU](https://img.shields.io/badge/WebGPU-AC162C?style=flat&logo=vulkan&logoColor=white)
![Markdown](https://img.shields.io/badge/Markdown-000000?style=flat&logo=markdown&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white)
[![codecov](https://codecov.io/gh/arttet/arttet.github.io/graph/badge.svg?token=H5YZVPX9CK)](https://codecov.io/gh/arttet/arttet.github.io)

My personal blog about the little stuff I know.

## 🛠 Management & Development

This project uses `just` as the primary task runner for managing development workflows and project utilities.

### ⚡ Justfile Commands

```text
$ just help
Available recipes:
    default # Show help
    help    # List all commands

    [Development]
    install # Install dependencies
    update  # Update dependencies
    audit   # Audit dependencies
    fmt     # Format code
    check   # Type check
    lint    # Run linters
    build   # Build production build
    preview # Start production server
    dev     # Start development server
    clean   # Remove build artifacts
    ci      # Run CI pipeline

    [Testing]
    test:
        all         # Run all test suites
        unit        # Run fast unit tests
        integration # Integration tests
        coverage    # Generate coverage
        lhci        # Run Lighthouse CI
        bundle      # Run bundle budget

    [Baselines]
    baseline:
        bundle    # Update bundle baseline
        snapshots # Update snapshots
        ci        # Update snapshots for CI

    [Deployment]
    deploy:
        [Deployment]
        list        # List Cloudflare Pages projects
        create name # Create a Cloudflare Pages project
        delete name # Delete a Cloudflare Pages project
```

## Requirements

To build and work on this project locally, these tools need to be installed on your machine:

- `git`
- `bun`
- `just`

## Installation

Install project dependencies:

```bash
bun install
```

For Playwright, the first local run may also require:

```bash
bunx playwright install
```

## Lefthook Setup

`lefthook` manages Git hooks. After `bun install`, enable the hooks with:

```bash
bunx lefthook install
```

You do not need a global `lefthook` installation. The local project version is enough.

The hook configuration lives in `lefthook.yml`.

### Hooks

**`pre-commit`** — runs in parallel on every commit:

| Check                    | Files                          |
| ------------------------ | ------------------------------ |
| `oxfmt --write`          | `*.{js,ts,svelte,json,css,md}` |
| `oxlint --deny-warnings` | `*.{js,ts,svelte}`             |
| `stylelint --fix`        | `*.{css,svelte}`               |
| `markdownlint`           | `src/content/**/*.md`          |
| `bun audit`              | —                              |

### Updating hooks

After pulling changes to `lefthook.yml`, reinstall to apply them:

```sh
bunx lefthook install
```

## Testing

### Unit tests

`just tu` (alias for `test unit`) runs Vitest with `VITEST_FAST=true`, which skips heavy DOM/Svelte component tests for a fast feedback loop. Use this during development.

To run the full suite including component tests:

```sh
just test coverage
```

### E2E tests

`just ti` runs Playwright against the production build at `http://localhost:4173`.
