---
Status: Active
Last Updated: 2026-05-04
---

# Platform Overview <Badge type="tip" text="v1" />

[arttet.dev](https://arttet.dev) is a personal publishing platform that feels like a static blog but works like a compiler.

You write Markdown with math, diagrams, and interactive components. The platform takes care of the rest. It validates your content, optimizes it, and turns everything into clean, deterministic HTML. There is no runtime CMS and no hydration overhead, because everything is resolved ahead of time.

Under the hood, the platform is built with SvelteKit and compiled using Bun. Features like math, diagrams, and syntax highlighting are processed during the build, so the final result stays fast and predictable. Any runtime code is only loaded when it is actually needed.

In the background, subtle visual effects powered by WebGPU run quietly without affecting performance.

## Core Sections

| Section                         | Audience       | What you will find                              |
| ------------------------------- | -------------- | ----------------------------------------------- |
| [Writer Guide](./writer/)       | Writers        | How to create and validate content              |
| [Developer Guide](./developer/) | Engineers      | How to run, extend, and work with the platform  |
| [Architecture](./architecture/) | Advanced users | How the system is designed and works internally |

## Quick Links

- [Start writing immediately](./writer/index.md#start)
- [Run the project locally](./developer/index.md#quick-start)
- [Architecture Overview](./architecture/index.md)
- [Infrastructure](./developer/infrastructure.md)

## How this documentation is organized

Three layers organize the work:

- **Platform** (`docs/platform/`) — what the system is today.
  - [Writer Guide](./writer/) for authors.
  - [Developer Guide](./developer/) for engineers.
  - [Architecture](./architecture/) for deep dives.
- **Evolution** (`docs/evolution/`) — how decisions move it forward (RFCs, ADRs).
- **Operations** (`operations/`) — what is actually being done right now (activities, kanban).
