---
title: Frontmatter Schema
status: active
last_updated: 2026-05-04
purpose: Strict YAML frontmatter contract for blog posts — fields, types, validation codes.
related:
  - ./index.md
  - ../architecture/markdown-pipeline.md
---

# Frontmatter Schema <Badge type="tip" text="v1" />

Every markdown file under `content/blog/` is validated against a strict JSON-Schema contract defined at `config/mdsvex/build/frontmatter-schema.js`. Unknown or malformed fields trigger an `MDX010_INVALID_FRONTMATTER` diagnostic, which fails the build in strict (CI) mode.

## The Schema

| Field       | Type       | Required | Description                                                                           |
| ----------- | ---------- | -------- | ------------------------------------------------------------------------------------- |
| `title`     | `string`   | yes      | Non-empty title of the document. Used as `<h1>` and `<title>`.                        |
| `created`   | `string`   | yes      | ISO-8601 date (`YYYY-MM-DD`). Interpreted as UTC if no timezone is given.             |
| `updated`   | `string`   | no       | ISO-8601 date of last modification.                                                   |
| `tags`      | `string[]` | no       | Array of non-empty strings. Used by search and tag panel.                             |
| `summary`   | `string`   | no       | Short description for cards, OpenGraph, RSS. Defaults to first paragraph.             |
| `cover`     | `string`   | no       | Relative path to cover image (e.g., `./cover.png`, must have `alt` in body).          |
| `draft`     | `boolean`  | no       | If `true`, post is excluded from manifest, RSS, sitemap, search, and knowledge graph. |
| `canonical` | `string`   | no       | Absolute URL for SEO. Duplicates across the workspace trigger a critical diagnostic.  |
| `toc`       | `boolean`  | no       | Render table of contents from headings. Defaults to `true`.                           |

## Example

```yaml
---
title: 'Understanding the AST Pipeline'
created: '2026-05-03'
updated: '2026-05-04'
tags: ['engineering', 'compiler']
summary: 'How we treat markdown as untrusted code.'
cover: './cover.png'
draft: false
---
```

## Rules

1. **Mandatory fields**: every post MUST have `title` and `created`.
2. **Date format**: dates must be ISO-8601 (`YYYY-MM-DD`); internal dates are normalized to UTC.
3. **No unknown fields**: ad-hoc keys break the build in strict mode (catches typos like `created`).
4. **Tags**: each item must be a non-empty string; the array itself may be omitted.
5. **Canonical**: if present, must be absolute and unique across the workspace.
6. **Draft mode**: `draft: true` excludes the post from RSS, sitemap, search index, knowledge graph, and the production blog list.

## Diagnostic Codes

| Code                            | Trigger                                    |
| ------------------------------- | ------------------------------------------ |
| `MDX001_UNKNOWN_COMPONENT`      | Used a component not in the registry       |
| `MDX002_UNSAFE_URL`             | URL uses an unsafe protocol                |
| `MDX003_RAW_HTML`               | Raw HTML node detected (blocked tags)      |
| `MDX004_UNSAFE_EVENT_HANDLER`   | Event handler attribute in markdown        |
| `MDX005_UNKNOWN_COMPONENT_PROP` | Unknown prop on a registered component     |
| `MDX006_IMAGE_MISSING_ALT`      | Image reference without `alt` text         |
| `MDX007_DUPLICATE_SLUG`         | Two posts produce the same slug            |
| `MDX008_DUPLICATE_HEADING`      | Duplicate heading ID in the same post      |
| `MDX009_LINK_TO_HIDDEN`         | Link to a `draft: true` or hidden post     |
| `MDX010_INVALID_FRONTMATTER`    | Frontmatter schema violation               |
| `MDX011_BROKEN_INTERNAL_LINK`   | Internal link target does not exist        |
| `MDX012_EMPTY_ANCHOR`           | Empty `href` (`#`)                         |
| `MDX014_MULTIPLE_H1`            | More than one `<h1>` in the post           |
| `MDX015_HEADING_HIERARCHY_SKIP` | Heading hierarchy skip (e.g., `h1` → `h3`) |

## Common Errors

- **Missing title** — build fails with `MDX010_INVALID_FRONTMATTER`.
- **Invalid date** — `03/05/2026` instead of `2026-05-03`.
- **Malformed YAML** — missing closing `---` or incorrect indentation.

<!-- AGENT_CONTEXT
Frontmatter schema and validation logic lives in:
  - config/mdsvex/build/frontmatter-schema.js
  - config/mdsvex/passes/content/frontmatter.js

Diagnostic codes live in config/mdsvex/constants.js.
If you change frontmatter rules, fields, or codes, update:
  - config/mdsvex/constants.js
  - config/mdsvex/build/frontmatter-schema.js
  - config/mdsvex/passes/content/frontmatter.js
  - docs/platform/writer/frontmatter.md (this file)
  - docs/platform/developer/troubleshooting.md
-->

## Related

- [Writer Guide](./index.md)
- [Markdown Pipeline](../architecture/markdown-pipeline.md)
