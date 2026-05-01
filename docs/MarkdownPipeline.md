# Ultimate Markdown Pipeline Architecture

The Markdown pipeline is a secure, extensible, AST-first build-time system designed for SvelteKit and MDsveX. It transforms raw Markdown content into rich, interactive posts while enforcing strict security boundaries, ensuring build-time determinism, and optimizing asset delivery through intelligent chunking, lazy loading, and an automated image pipeline.

## Core Philosophy

1.  **Security by Whitelist**: Only specifically registered components, properties, and URL protocols are allowed. Everything else is blocked.
2.  **Zero-Impact Runtime**: Complex processing (math, highlighting, diagrams) happens at build time. Runtime scripts and styles are loaded only if the post actually uses them.
3.  **Total Determinism**: Build outputs are identical regardless of environment, file system order, or partial rebuilds.
4.  **100% Test Coverage**: Every transformation and security guard must be covered by unit tests. If a post fails a critical guard in strict mode, it is excluded from the build.

## Architecture: The "Pass" System

The system is structured as a central engine that orchestrates a sequence of discrete **Passes**. A Pass is a single cycle of processing over the AST (Remark/Rehype) or metadata.

## Pass Execution Contract

- Passes are executed in a deterministic order.
- Pass dependencies must be explicitly declared.
- A pass must be:
  - pure (no side-effects outside context)
  - idempotent (safe to re-run)
- Passes must not mutate shared global state.

### Pass Aggregation

To simplify the main pipeline, Passes can be aggregated into logical groups (e.g., `contentPasses`, `securityPasses`, `optimizationPasses`). The engine executes these aggregated passes sequentially, maintaining dependency integrity.

### Directory Structure

```txt
config/
  mdsvex/
    index.js            # SvelteKit/MDsveX entry point
    engine.js           # Orchestration logic
    registry.js         # Whitelist of allowed components & features
    diagnostics.js      # Reporting system
    passes/             # Transformation modules
      content/          # Content enrichment passes
        frontmatter.js    # YAML metadata extraction & Schema validation
        directives.js     # Container (::::) and leaf (:) directives
        code.js           # Shiki highlighting with language splitting
        code-tabs.js      # Custom ::::codetabs container
        math.js           # Build-time KaTeX rendering
        mermaid.js        # Mermaid diagram detection
        links.js          # Internal link and anchor validation
        headings.js       # Hierarchy and ID validation
        toc.js            # Headings & Table of Contents
        reading-time.js   # Word count & time estimation
      security/         # Security validation passes
        security-guard.js # Whitelist enforcement (URLs, HTML, Props)
      optimization/     # Build optimization passes
        images.js         # WebP pipeline & lazy loading injection
        extraction.js     # Final manifest & graph generation

target/build/generated/ # Build artifacts
  content-manifest.json # Post metadata & feature flags
  knowledge-graph.json  # Inter-post relationships
  diagnostics.json      # Build-time diagnostic report
  diagnostics.md        # Human-readable build report
```

## Component & Feature Registry

All allowed components, directives, and features must be declared in a central registry.

### Rules

- Unknown components → `MDX001_UNKNOWN_COMPONENT`
- Unknown props → `MDX005_UNKNOWN_COMPONENT_PROP`
- Registry is the single source of truth for:
  - validation
  - feature flags
  - rendering behavior

## Snapshot Baseline (Critical for Migration)

Before any structural refactoring or migration to the new pipeline:

1.  **Capture Baselines**: Generate HTML output for 3–5 representative posts (using math, code, images, etc.).
2.  **Golden References**: Store these snapshots as immutable golden references.
3.  **Validation**: Any structural or visual HTML change in the rendered output is considered a regression and must be resolved before the PR is merged.
4.  **Goal**: Guarantee zero visual regression during the transition from legacy preprocessors to the "Pass" system.

## Slug & ID Policy

- All slugs must be deterministic and stable.
- Slug generation must not depend on file system order or metadata.
- Duplicate slugs are forbidden (`MDX007_DUPLICATE_SLUG`).

### Heading IDs

- Generated via a stable, deterministic slugify function.
- Duplicate heading IDs within a single post are forbidden (`MDX008_DUPLICATE_HEADING`).
- IDs must be normalized before extraction into the Knowledge Graph.

### Canonical IDs

All nodes in the Knowledge Graph must use globally unique canonical IDs:

- **Post**: `post:slug`
- **Tag**: `tag:slug`
- **Heading**: `heading:post-slug#heading-id`
- **Image**: `image:stable-hash`
- **Code**: `code:language-name`

## Build Determinism Contract

All outputs must be deterministic:

- **Same input → identical output** (byte-level parity).
- **No dependency on**:
  - File traversal order.
  - Asynchronous timing (race conditions).
  - Map/Set iteration order.
- **Mandatory Sorting**: All collections must be sorted by canonical keys before serialization (posts, diagnostics, graph nodes, graph edges).

## Incremental Cache

To maintain performance without sacrificing correctness, expensive operations are cached.

### Cache Key

`cacheKey = hash(content + pipelineVersion + passVersion + dependencyVersions)`

### Rules

- **Automatic Invalidation**: Cache is invalidated if content, pipeline version, or pass logic changes.
- **Integrity**: Caching must never affect the determinism of the final output.
- **Covered Operations**: Shiki highlighting, Image optimization, Math rendering.

## Code Highlighting

- **Build-time Execution**: Shiki runs exclusively at build-time to generate static HTML.
- **No Client Runtime**: No Shiki runtime or grammar files are included in the client bundle.
- **Strict Language Whitelist**: Only languages explicitly registered in the pipeline are allowed; others trigger a diagnostic.

## Feature Flags & Chunking Strategy

### Feature Flags

Each post produces a deterministic set of flags derived during pipeline passes:

- `hasMath`, `hasMermaid`, `hasCode`, `hasCodeTabs`, `hasImages`, `hasInteractiveBlocks`.

### Chunking Contract

- **Principle**: One feature = one lazy-loaded chunk.
- **No Leakage**: No feature code/style is loaded unless required by the associated feature flags.
- **Implementation**:
  - `hasMath` → Injects KaTeX CSS into `<head>`.
  - `hasMermaid` → Triggers dynamic `import()` of `mermaid.js`.
  - `hasCodeTabs` → Loads CodeTabs interaction logic.

### Manual Chunking (Rollup)

```js
output: {
  manualChunks(id) {
    if (id.includes('node_modules/katex')) return 'markdown-katex';
    if (id.includes('node_modules/mermaid')) return 'markdown-mermaid';
    if (id.includes('src/shared/markdown')) return 'markdown-runtime';
  }
}
```

## Knowledge Graph Extraction

The `extraction` pass derives structured, deterministic relationships from content.

### Extracted Data

- Tags (`post → tag`)
- Links (`post → post`)
- Headings (`post → heading`)
- Code blocks (`post → code:lang`)
- Images (`post → image`)
- Math (`post → math`)
- Mermaid (`post → diagram`)

### Rules

- Nodes and edges must be stable-sorted.
- **Skipped or invalid posts must not appear in the graph.**
- Links to unpublished or draft posts trigger a diagnostic (`MDX009_LINK_TO_HIDDEN`).

## Diagnostics Contract

- **Stability**: Diagnostics must be stable and deterministic across runs.
- **Fields**: Every diagnostic must include `code`, `severity`, `message`, and `location` (file, line, column).
- **Severity Levels**: `info`, `warning`, `error`, `critical`.
- **Aggregation**: The pipeline must not stop on the first error. It collects all diagnostics for a post in a single run.

## Validation Modes

### Warn Mode (Development / Migration)

- Critical diagnostics are reported as `warning` (message includes `would skip`).
- No posts are excluded from output.
- Used to identify and fix existing content issues.

### Strict Mode (Production / CI)

- Any `critical` diagnostic skips the post.
- Only `valid` posts are included in the manifest, RSS, sitemap, search, and knowledge graph.

## Security Boundary

Markdown is treated as untrusted input. The boundary is enforced at build-time.

- **Allowed**: Registered components only, safe URL protocols (`http`, `https`, `mailto`), processed local images, sanitized math/code output.
- **Blocked**: Raw HTML, inline event handlers, unknown components, unknown props, dangerous protocols (`javascript:`, `vbscript:`, `data:`).
- **Enforcement**: No raw HTML reaches output unless explicitly **allowlisted**.

## Dev Mode & HMR Policy

- **Fast Refreshes**: In `dev` mode, expensive optimization passes (like high-res image generating) may be bypassed or use low-res placeholders.
- **HMR Cache**: The incremental cache must support hot module replacement, ensuring only the changed post is re-processed.

## Search Index Generation

A specialized `searchPass` extracts content for the index:

- **Clean Text**: Strips Markdown, HTML, and code blocks to keep the index small.
- **Exclusion**: Only `valid` and `published` posts are indexed.

## Performance Budgets

Violations produce diagnostics (`MDX2xx_PERF_*`):

- Max initial JS bundle size.
- Max per-post JS chunk size.
- Max image size after optimization.
- Max HTML size per post.

## Authoring Constraints

Authors must follow these constraints to ensure successful builds:

- Use only supported Markdown and directive syntax.
- Provide descriptive `alt` text for all images.
- Use valid, supported code languages for syntax highlighting.
- **Never use raw HTML** for styling or layout.

## Pipeline Versioning

A `pipelineVersion` is included in all generated artifacts. This ensures:

- Robust cache invalidation.
- Easier debugging and reproducibility.
- Clear tracking of architectural changes.

## Testing Strategy

### 100% Coverage Requirement

The build will fail if coverage drops below 100% for statements, branches, functions, or lines within `config/mdsvex`.

### Golden Tests (Fixtures)

Every `Pass` is validated using fixtures in `tests/markdown/fixtures/`:

- **Valid**: Assert correct HTML, feature flags, and graph nodes.
- **Invalid**: Assert specific diagnostic codes and "skipped" status.

## Final Invariants

- No unknown component reaches output.
- No raw HTML reaches output unless explicitly allowlisted.
- No image reaches output unless optimized.
- No invalid post is published.
- No draft appears in RSS/sitemap/search.
- No KaTeX CSS loads without math.
- No Mermaid chunk loads without Mermaid.
- No Shiki runtime reaches client.
- No post-specific asset leaks into global bundle.
- No knowledge graph data is generated from skipped posts.
