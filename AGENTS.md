# AGENTS.md — AI Agent Contract

## Objective

Minimize tokens. Maximize signal.  
Default: **concise, structured, actionable**.

---

## Core Rules

- No full files unless required
- Prefer **diffs / patches / snippets**
- No repetition of user input
- No explanations unless asked
- Stay strictly within **Scope**
- Correctness > Brevity

---

## Input Contract

```
Context: <1–2 lines>
Goal: <target>
Problem: <symptom>
Scope: <strict boundaries>
Artifacts: <minimal code/logs>
Constraints: (optional)
```

---

## Token Optimization

- No full logs / lockfiles
- Logs ≤ ~50 lines
- Code = minimal reproducible snippet
- Prefer references over duplication

---

## Code Rules

- Use **unified diff**
- No unrelated refactors
- No renames unless required
- Preserve architecture

---

## Forbidden

- Full file rewrites
- Repeating input
- Theory / fluff
- Overengineering
- Guessing outside scope

---

## Workflow (Sprint)

1. Plan (files to touch)
2. Implement (edits only)
3. Commands (exact)
4. User runs
5. Feedback → iterate
6. Merge

---

## Command Contract

### Start PR

```sh
just ci
just ta
git checkout main
git pull --rebase
git checkout -b <type>/<slug>
```

### Per change

```sh
git add <files>
git commit -m "<type>(<scope>): <subject>"
```

### End PR

```sh
git push -u origin <branch>
gh pr create --fill
```

### Updates

```sh
git push --force-with-lease
```

---

## Conventions

- Conventional Commits (required)
- Branch: `<type>/<slug>`
- Plans → `.ai/plans/*.md`

---

## Stack

- Svelte 5 (Runes), SvelteKit 2 (static)
- Vite 8, Bun
- Tailwind v4 (`@theme` in `app.css`)
- WebGPU (WGSL only)
- mdsvex + Shiki + KaTeX
- FlexSearch
- Oxc (no Prettier)
- Vitest + Playwright

---

## Guardrails

- **Coverage ≥ 90%**
- **NO Svelte 4 syntax**
- **NO tailwind.config**
- **NO WebGL / Three.js**
- Strict TS (no `any`)
- Use Bun only

---

## Architecture (FSD)

```
shared → entities → features → widgets → routes
```

- No upward imports
- Use aliases: `$shared`, `$entities`, `$features`, `$widgets`

---

## Key Areas

### Content

- MD → preprocess → mdsvex → static output
- KaTeX + CodeTabs handled at build time
- No client-side parsing

### Engine

- WebGPU only
- WGSL shaders
- CPU → GPU buffer updates
- Add features via **new Pass**

---

## Shared UI (reuse only)

- CodeBlock
- CodeTabs
- CopyButton
- MathCopy
- Seo

---

## Commands

```sh
bun run dev
bun run build
bun run preview

just ci
just ta
just tu
just ti
just tc
just lint
just check
just fmt
```

---

## Deep Mode

Trigger: `deep`  
→ allow reasoning, tradeoffs, alternatives

---

## Priority

```
Correctness > Brevity > Completeness
```
