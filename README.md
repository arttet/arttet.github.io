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
    default   # Show help
    help      # List all commands

    [Authoring]
    new title # Scaffold post
    spell     # Spell check

    [Development]
    install   # Install dependencies
    update    # Update dependencies
    audit     # Audit dependencies
    fmt       # Format code
    check     # Type check
    lint      # Run linters
    build     # Build production build
    preview   # Start production server
    dev       # Start development server
    clean     # Remove build artifacts
    ci        # Run CI pipeline

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
        snapshots # Update testing snapshots
        ci        # Update testing snapshots for CI

    [Deployment]
    deploy:
        list        # List Cloudflare Pages projects
        create name # Create a Cloudflare Pages project
        delete name # Delete a Cloudflare Pages project
```

## Requirements

To build and work on this project locally, you need the following tools installed:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) (v24 or higher)
- [Bun](https://bun.sh/) (latest stable)
- [Just](https://github.com/casey/just#installation) (v1.50.0 or higher)

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

- **`pre-commit`** — runs sequentially on every commit:

| Check                    | Files                              |
| ------------------------ | ---------------------------------- |
| `oxfmt --write`          | `*.{js,ts,svelte,json,css,yml,md}` |
| `oxlint --deny-warnings` | `*.{js,ts,svelte}`                 |
| `stylelint --fix`        | `*.{css,svelte}`                   |
| `markdownlint --fix`     | `content/**/*.md`                  |
| `cspell`                 | `*.{md,svelte,ts}`                 |
| `bun audit`              | —                                  |

- **`commit-msg`** — validates conventional commit format via `commitlint`.
- **`pre-push`** — runs security scans (`gitleaks`) against staged content.

## Testing

### Unit tests

Fast unit tests:

```sh
just test unit
```

This runs Vitest with `VITEST_FAST=true` for a quick development feedback loop.

Full unit suite with coverage:

```sh
just test coverage
```

Use coverage before opening a PR when component behavior changed. Coverage must stay at or above 90%.

### Playwright tests

Run Playwright integration/E2E tests:

```sh
just test integration
```

Direct Playwright command for the desktop Chrome project:

```sh
bunx playwright test --project chrome-desktop --no-deps --reporter=list
```

### All local tests

Run unit, Playwright integration, and coverage:

```sh
just test all
```

### Snapshot testing

Visual regression tests use Playwright `toHaveScreenshot`. Current post snapshots live under the Playwright snapshot folders and are validated on `chrome-desktop`.

Update local snapshots:

```sh
just baseline snapshots
```

Update CI snapshots through Docker:

```sh
just baseline ci
```
