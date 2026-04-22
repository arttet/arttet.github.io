# My personal blog

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Svelte](https://img.shields.io/badge/Svelte-FF3E00?style=flat&logo=svelte&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white)
![Markdown](https://img.shields.io/badge/Markdown-000000?style=flat&logo=markdown&logoColor=white)
[![codecov](https://codecov.io/gh/arttet/arttet.github.io/graph/badge.svg?token=H5YZVPX9CK)](https://codecov.io/gh/arttet/arttet.github.io)

My personal blog about the little stuff I know.

## 🛠 Management & Development

This project uses `just` as the primary task runner for managing development workflows and project utilities.

### ⚡ Justfile Commands

```text
Available recipes:
    default # Show help
    help    # List all commands

    [Development]
    deps    # Install dependencies
    bump    # Update dependencies
    fmt     # Format code
    check   # Type check
    lint    # Run all blazing-fast linters
    build   # Build for production
    preview # Preview production build
    run     # Start dev server
    clean   # Remove build artifacts
    ci      # Run CI pipeline

    [Testing]
    test:
        all         # Run all test suites
        unit        # Run unit tests
        integration # Integration tests
        coverage    # Generate coverage
```

## Requirements

To build and work on this project locally, these tools need to be installed on your machine:

- `bun`
- `just`
- `git`

Optional but recommended:

- a recent Chromium-based browser for local testing and WebGPU support

Notes:

- `bun` is required for installing dependencies and running project scripts
- `just` is the main task runner used throughout the repo
- `lefthook` does not need to be installed globally because it is already included in the project devDependencies

## Installation

Install project dependencies:

```bash
bun install
```

If you use `just`, you can do the same with:

```bash
just deps
```

For Playwright, the first local run may also require:

```bash
bunx playwright install
```

## Lefthook Setup

`lefthook` is used for the `pre-commit` hook. The hook runs formatting and linting on staged files.

After `bun install`, enable the hooks with:

```bash
bunx lefthook install
```

You do not need a global `lefthook` installation. The local project version is enough.

The hook configuration lives in `lefthook.yml`.

Current `pre-commit` checks:

- `biome`
- `oxlint`
- `stylelint`
- `markdownlint`
