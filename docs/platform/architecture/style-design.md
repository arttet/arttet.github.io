---
title: Design System
status: active
last_updated: 2026-05-04
purpose: Tailwind v4 tokens, .glass / .mesh-gradient / .prose primitives, dark/light view-transition.
related:
  - ./index.md
  - ./webgpu-pipeline.md
  - ../developer/conventions.md
---

# Design System <Badge type="warning">beta</Badge>

Tailwind v4 with `@theme` tokens defined in `src/app.css`. Two themes (deep cosmic dark, warm ivory light) toggle via a class on `<html>` using `startViewTransition` with a circular clip-path animation. Glassmorphism and a CSS `mesh-gradient` fallback live under `src/shared/styles/`.

## Tokens

Defined in `src/app.css` via `@theme`. Consumed via standard Tailwind utilities (e.g. `text-accent`, `bg-bg`).

### Colors

| Token            | Dark (default)          | Light                     |
| ---------------- | ----------------------- | ------------------------- |
| `--color-accent` | `#00d4aa` (cyan-teal)   | `#7c5cbf` (purple-indigo) |
| `--color-bg`     | `#020408` (deep cosmic) | `#faf8f4` (warm ivory)    |
| `--color-text`   | `#c9d1d9`               | `#2c2620`                 |
| `--color-border` | `#1a2535`               | `#ddd5c8`                 |

### Typography

- **Sans**: `Geist Variable` — UI and prose.
- **Mono**: `JetBrains Mono Variable` — code, technical data.

### Z-index layers

`--z-behind`, `--z-hero`, `--z-copy`, `--z-nav`, `--z-backdrop`, `--z-modal`.

## Primitives

### `.glass` — glassmorphism

`src/shared/styles/glass.css`. Used for the navbar and floating panels.

- `backdrop-filter: blur(...)` + adaptive surface color (`--color-surface-2`).
- Specular gradient + low-frequency noise texture.

### `.mesh-gradient` — WebGPU fallback

Performant CSS fallback for the WebGPU background. Multi-layered `radial-gradient`s mapped to the current theme's accent and background colors.

### `.prose` — article typography

`src/shared/styles/content.css`. Heading hierarchy, paragraph spacing, link colors, code block padding. Applied to rendered markdown body.

## Theme Switching

- Store: `src/features/theme/theme.ts` — Svelte 5 rune-based store, persisted to `localStorage`.
- Toggle: adds/removes `.dark` on `<html>`.
- Transition: wrapped in `document.startViewTransition` with a circular `clip-path` animation centered on the toggle button.
- Anti-flash: inline script in `src/app.html` reads the stored theme before stylesheet load.

## Style Guidelines

1. **Tailwind first**. Avoid custom CSS in `.svelte` files — use utilities.
2. **Theme-aware**. Verify both themes; use `dark:` variants only if token overrides are insufficient.
3. **Semantic tokens**. Prefer `--color-text-muted` over raw hex.
4. **View transitions** for global state changes; standard CSS transitions for micro-interactions.
5. **A11y**. Min contrast ratio 4.5:1; respect `prefers-reduced-motion`.

## Related

- [Architecture Overview](./index.md)
- [WebGPU Pipeline](./webgpu-pipeline.md)
- [Conventions](../developer/conventions.md)
