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

A personal publishing platform that looks like a static blog and behaves like a compiler.

| Resource      | URL                                          | What                                        |
| ------------- | -------------------------------------------- | ------------------------------------------- |
| Live site     | [arttet.dev](https://arttet.dev)             | My personal blog                            |
| Platform docs | [docs.arttet.dev](https://docs.arttet.dev)   | Writer guide, developer guide, architecture |
| Infra reports | [infra.arttet.dev](https://infra.arttet.dev) | Playwright, Lighthouse, bundle, coverage    |

## Requirements

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) (v24 or higher)
- [Bun](https://bun.sh/) (latest stable)
- [Just](https://github.com/casey/just#installation) (v1.50.0 or higher)

## Install

```bash
bun install
bunx lefthook install
```

## Just Commands

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

    [Documentation]
    docs:
        dev     # Serve docs
        build   # Build docs
        preview # Preview docs

    [Baselines]
    baseline:
        bundle    # Update bundle baseline
        snapshots # Update testing snapshots
        ci        # Update testing snapshots for CI

    [Pull Requests]
    pr:
        create      # Create a new Pull Request
        review n="" # Ask Gemini to review the Pull Request
        view n=""   # View comments for the Pull Request

    [Deployment]
    deploy:
        list        # List Cloudflare Pages projects
        create name # Create a Cloudflare Pages project
        delete name # Delete a Cloudflare Pages project
```
