---
title: Writer Guide
status: active
last_updated: 2026-05-04
purpose: How to author posts — scaffolding, supported markdown features, validation.
related:
  - ./frontmatter.md
  - ../architecture/markdown-pipeline.md
---

# Writer Guide <Badge type="tip" text="v1" />

This guide covers how to create, format, and preview content on the platform.

## Start Writing Immediately

Use the scaffolding command to ensure your post is placed correctly and contains a valid frontmatter schema:

```sh
just new "The Title of My Post"
```

## Storage & Naming

- **Storage**: `content/blog/YYYY/`
- **Filename**: `YYYY-MM-DD-slug.md`
- **Slugs**: derived automatically from the filename. Changing the filename changes the URL.

## Frontmatter

Every post must begin with a YAML block. The system validates it at build time to ensure SEO and site integrity.

→ See the [Full Frontmatter Schema](./frontmatter.md).

## Features

### Code Blocks

Syntax highlighting is performed at build time.

```ts
const platform: string = 'deterministic';
```

### Code Tabs

Group multiple languages in a single block using the `:::code-tabs` directive.

````md
:::code-tabs

```ts title="TypeScript"
const x: number = 1;
```

```js title="JavaScript"
const x = 1;
```

:::
````

### Math (KaTeX)

Rendered to static HTML at build time.

- **Inline**: `$E=mc^2$`
- **Block**: `$$\int_{a}^{b} f(x) \, dx$$`

### Diagrams (Mermaid)

Rendered to static SVG at build time. No client-side Mermaid runtime ships unless you opt in.

````md
```mermaid
graph TD;
    A-->B;
```
````

### Images

Images should be placed adjacent to the markdown file in the same directory.
Use relative paths and always provide an `alt` attribute.

`![Alt description of the image](./my-image.png)`

## Errors & Fixing

1. **Invalid frontmatter** — build fails (strict mode in CI) or warns (locally). Check CLI output for the exact field name.
2. **Broken internal links** — `[anchor](./unknown-post)` triggers `MDX011_BROKEN_INTERNAL_LINK`.
3. **Missing alt text** — images must have alt text: `![description](./path.png)`.

To find issues locally:

```sh
just check
just spell                       # cspell + markdownlint
just preview                     # production build preview
bun run content:diagnostics      # detailed report → target/generated/diagnostics.{md,json}
```

<!-- AGENT_CONTEXT
When assisting writers:
- Remind them to use `just dev` for live previews.
- Ensure all images use relative paths (`./img.png`) and include `alt` text.
- Validate frontmatter schema and mention strict date formats (YYYY-MM-DD).
-->

## Related

- [Frontmatter](./frontmatter.md)
- [Markdown Pipeline](../architecture/markdown-pipeline.md)
