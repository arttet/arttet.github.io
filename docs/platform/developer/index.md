---
title: Developer Guide
status: active
last_updated: 2026-05-04
purpose: Single entry point for engineers and AI agents working on arttet.dev.
related:
  - ./workflow.md
  - ./commands.md
  - ./testing.md
  - ../architecture/index.md
---

<!-- AGENT_CONTEXT
Always-load: this file + workflow.md. Read others on demand only when the task touches that subsystem.
Token economy and code rules: conventions.md → AGENT_CONTEXT comment.
Prefer short just aliases (ci, tu, ti, ta, tc) to save tokens.
-->

# Developer Guide <Badge type="warning" text="beta" />

[arttet.dev](https://arttet.dev) is a static SvelteKit app compiled by Bun. The markdown pipeline is an AST-first compiler that bakes math, diagrams, and syntax highlighting into deterministic HTML at build time. A WebGPU particle background runs off the main thread. CI deploys to GitHub Pages and Cloudflare Pages.

## Quick Start

```sh
bun install          # install dependencies
just dev             # → http://localhost:5173
just docs dev        # → VitePress (this site)
```

Full commands reference: [commands](./commands.md)

## What lives where

Directory Structure in [architecture](../architecture/index.md#directory-structure).

## Where to go next

| If you want to...                          | Read                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| Ship a change end-to-end                   | [workflow.md](./workflow.md)                                                          |
| Run tests / coverage / Playwright          | [testing.md](./testing.md)                                                            |
| Add a markdown pass, UI component, or docs | [extending.md](./extending.md)                                                        |
| Look up a CLI command                      | [commands.md](./commands.md)                                                          |
| Check code or doc standards                | [conventions.md](./conventions.md)                                                    |
| Fix a CI failure                           | [troubleshooting.md](./troubleshooting.md) → [infrastructure.md](./infrastructure.md) |
| Understand a subsystem                     | [architecture/](../architecture/index.md)                                             |

## Related

- [Engineering Workflow](./workflow.md)
- [Architecture Overview](../architecture/index.md)
- [Evolution Workflow](../../evolution/workflow.md)
