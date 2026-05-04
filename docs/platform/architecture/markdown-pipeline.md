---
title: Markdown Pipeline
status: active
last_updated: 2026-05-04
purpose: AST-first build-time compiler — deterministic, secure, zero-runtime markdown rendering for SvelteKit.
related:
  - ./index.md
  - ../developer/extending.md
  - ../writer/frontmatter.md
---

# Markdown Pipeline <Badge type="danger">beta</Badge>

The Markdown pipeline is a secure, extensible, AST-first build-time system designed for SvelteKit and MDsveX. It operates as a deterministic compiler, transforming raw Markdown content into rich, interactive posts while enforcing strict security boundaries, SEO constraints, and resource limits.

## 1. Core Philosophy & Determinism

1.  **Security by Whitelist**: Only specifically registered components, properties, and URL protocols are allowed. Everything else is blocked.

2.  **Zero-Impact Runtime**: Complex processing (math, highlighting, diagrams) happens at build time. Runtime scripts and styles are loaded only if the post actually uses them.

3.  **Total Determinism**: Build outputs are identical regardless of environment, file system order, or partial rebuilds.
    - **Same input → identical output** (byte-level parity).
    - **No dependency on**: File traversal order, asynchronous timing, or Map/Set iteration order.
    - **Timestamps**:
      - If `SOURCE_DATE_EPOCH` is present, all generated timestamp fields MUST use its value.
      - If `SOURCE_DATE_EPOCH` is absent, all generated timestamp fields MUST be omitted from build artifacts to guarantee determinism.
    - **Mandatory Sorting**: All collections must be sorted by canonical keys before serialization (posts, diagnostics, graph nodes, graph edges).

4.  **Cross-OS Determinism (Environment Parity)**: To prevent caching and graph issues across different operating systems:
    - **Line Endings**: Mandatory LF (`\n`) normalization before processing.
    - **Paths**: POSIX path (`/`) normalization for all internal URLs and graph edges.
    - **Timezones**: Dates must be ISO-8601. If no timezone is provided, the date is interpreted as UTC. All internal dates are normalized to UTC.

5.  **Supply-Chain Pinning**: The build relies entirely on pinned, local dependencies.
    - A strict lockfile is required.
    - Versions for Shiki, Mermaid, and KaTeX must be explicitly pinned.
    - Only an explicitly allowlisted set of Shiki grammars and themes may be loaded.
    - Dynamic remote loading (e.g., fetching scripts or grammars over HTTP) during the build is strictly forbidden.

## 2. Architecture & Execution Model

The system is structured as a central engine that orchestrates a sequence of discrete **Passes**.

### Execution Graph / Scheduler

The pipeline operates as a **Directed Acyclic Graph (DAG)** of Passes, resolved via topological sorting.

- **Pass Definition**:

```typescript
type StateKey = keyof PipelineState;

type Pass = {
  name: string;
  phase: 'pre' | 'remark' | 'rehype' | 'validate' | 'post' | 'extract';
  requires?: string[]; // DAG dependencies
  reads?: StateKey[]; // Explicit Input Contract
  writes?: StateKey[]; // Explicit Output Contract

  // Global setup executed once per engine instantiation
  setup?: (ctx: BuildContext) => void | Promise<void>;

  // Core compiler transformation logic
  run: (ctx: PostContext, build: BuildContext) => void | Promise<void>;

  // Integration adapter for SvelteKit/MDsveX preprocessing
  mdsvex?: (ctx: BuildContext) => Partial<MdsvexOptions>;
};
```

**Phase Semantics**:

- `pre`: Operates before AST creation (raw text / frontmatter parsing).
- `remark`: Operates on Markdown AST (`mdast`).
- `rehype`: Operates on HTML AST (`hast`).
- `validate`: Performs structural and content validation without mutating the AST.
- `post`: Final AST transformations before serialization.
- `extract`: Produces non-AST artifacts (manifests, graph edges, search indexes).

**Cycle Detection**:

- The engine performs fail-fast cycle detection during topological sorting. If a cycle is detected, the build aborts immediately.

### Concurrency & Isolation Model

- **Posts Level (Parallel)**: Posts are processed concurrently via a worker pool to maximize build performance.
- **Pass Level (Sequential)**: Within a single post, Passes execute strictly sequentially based on the ordered DAG to prevent race conditions.

### Build Context vs Post Context

To ensure parallel safety, the pipeline separates immutable global build state from isolated per-post state:

- **BuildContext**: Shared, read-only data populated during the engine setup phase.

```typescript
type BuildContext = {
  mode: 'warn' | 'strict';
  pipelineVersion: string;
  dependencyVersions: Record<string, string>;
  allPosts: PostIndex; // Known slugs, paths
  registry: ComponentRegistry;
  cache: CacheHandler;
};
```

- **PostContext**: Isolated mutable state for a single post processing run.

```typescript
type PostContext = {
  file: string;
  ast: Mdast | Hast;
  diagnostics: DiagnosticsRegistry;
  state: PipelineState;
};
```

## 3. Data & State Contracts

### Typed Pipeline State (Pass I/O Contract)

The per-post state is strictly typed. A Pass may only read keys listed in its `reads` array and may only write keys listed in its `writes` array. This prevents hidden coupling and ensures reproducibility.

```typescript
type PipelineState = {
  frontmatter?: Frontmatter;
  featureFlags?: FeatureFlags;
  toc?: TocEntry[];
  links?: LinkRef[];
  assets?: AssetRef[];
};

type FeatureFlags = {
  hasMath: boolean;
  hasMermaid: boolean;
  hasCode: boolean;
  hasCodeTabs: boolean;
  hasImages: boolean;
  hasInteractiveBlocks: boolean;
};
```

### Content Schema (Frontmatter)

Markdown frontmatter is strictly validated against a defined schema. Extraneous or unknown fields trigger diagnostics.

```typescript
type Frontmatter = {
  title: string; // Required: Cannot be empty.
  description?: string;
  created: string; // Required: ISO-8601 date.
  updated?: string; // Optional: ISO-8601 date.
  draft?: boolean; // Optional: Defaults to false.
  tags?: string[]; // Optional: Array of non-empty strings.
  canonical?: string; // Optional: Absolute URL for SEO.
};
```

**Diagnostics**: `MDX010_INVALID_FRONTMATTER` is emitted for missing titles, invalid dates, unknown fields, or duplicate canonical URLs across the workspace.

### Slug & Link Policy

The pipeline enforces strict rules on document identities and internal referencing:

- **Deterministic Slugs**: File slugs must be deterministic. A duplicate slug triggers a critical diagnostic.
- **Stable Headings**: Heading IDs must be deterministically generated via a stable slugify function.
- **Link Validation**: All internal links are validated against the known slug registry (`BuildContext.allPosts`). Linking to a missing slug or a draft post is a critical error.

### AST Contract & Typing Strategy

The pipeline leverages two AST formats:

1. **Markdown AST (Remark / mdast)**: Used for content enrichment, structural validation, and feature detection.
2. **HTML AST (Rehype / hast)**: Used for DOM-level optimizations (lazy loading images, auto-linking headings).

**Explicit Node Whitelist**:

- **Allowed**: `paragraph`, `heading`, `code`, `link`, `image`, `customDirective` (mapped to registered components).
- **Blocked**: `raw` HTML nodes are strictly forbidden and will trigger a diagnostic unless explicitly mapped to a safe internal component.

**AST Mutation Contract**:

- Only passes in the `remark`, `rehype`, and `post` phases may mutate the AST.
- The `validate` and `extract` phases must be strictly read-only.
- All AST mutations must be deterministic and idempotent.

### Asset Pipeline Boundary

Markdown image references are normalized into `AssetRef` objects. The pipeline does not blindly trust Vite to find them. The image pass must either:

1. **Rewrite** them into explicit Svelte/Vite-importable references (e.g., `import img from './img.png'`).
2. **Optimize & Copy** them into the generated assets directory and emit stable, hashed URLs directly into the AST.

## 4. Resilience & Error Handling

### Error Handling Strategy (Fail Model)

The pipeline uses a structured diagnostics system. Passes report diagnostics rather than throwing exceptions.

- **Formal Diagnostic Schema**:

```typescript
type Diagnostic = {
  code: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  file: string;
  line: number;
  column: number;
  pass: string;
};
```

_Rule_: Diagnostics must be deterministically sorted by `file`, `line`, `column`, then `code`.

- **Fail Modes**:
  - **Strict Mode (Production / CI)**: Any critical diagnostic acts as a **Hard Fail**. The specific post is excluded from all build artifacts, **and the overall CI build must fail**.
  - **Warn Mode (Development)**: `critical` diagnostics are downgraded to `warning` (marked as "would skip"). The post is included (Soft Fail) to aid debugging, and the build succeeds.
- **Panic Isolation**: A failure in one post is isolated (it does not panic the worker pool), but the collected diagnostics will ultimately halt the build in Strict Mode.

## 5. Security & Accessibility Boundaries

Markdown is treated as untrusted input. The boundary is enforced at build-time.

### Security Threat Model & Resource Limits

To prevent DoS attacks, Prototype Pollution, and SSRF, the pipeline enforces strict rules and mandatory **Hard Limits**:

| Threat Category           | Example Attack                 | Pipeline Mitigation                                                                                                                                                                           |
| :------------------------ | :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **XSS via Markdown**      | `<script>alert(1)</script>`    | Raw HTML nodes blocked. Strict URL protocol allowlist. Event handlers (`on*`) rejected.                                                                                                       |
| **Resource Exhaustion**   | 100,000 deep nested blocks     | **Hard Limits**: Max file size (1MB), Max AST nodes (10,000), Max heading depth (h6), Max image count (50), Max pass duration (2s). Violations emit `MDX2xx_RESOURCE_*` critical diagnostics. |
| **Supply Chain**          | Malicious Shiki grammar        | Shiki grammars run strictly at build-time within resource limits.                                                                                                                             |
| **Prototype Pollution**   | Exploiting AST transformer     | `PostContext` is isolated. AST nodes checked against explicit schema whitelist.                                                                                                               |
| **SSRF / Path Traversal** | Image URL `file:///etc/passwd` | Enforced safe protocols. Local paths validated to ensure they do not escape the workspace root.                                                                                               |

### Mermaid Rendering Policy

- **Default (Mode A)**: Mermaid diagrams are rendered to static SVG at **build-time**. No client-side Mermaid JS is shipped to the browser.
- **Opt-in (Mode B)**: Client-side rendering is strictly disabled unless explicitly opted into via a directive for interactive diagrams. In Mode B, the Mermaid runtime is lazy-loaded, and the input source is sanitized, subject to a `Max Mermaid source size` limit.

### Accessibility (A11y) Build-Time Contract

A11y is a compile-time constraint:

- **Images**: `alt` attributes are strictly enforced (`MDX006_IMAGE_MISSING_ALT`).
- **Links**: Empty anchor links (`href="#"`) are blocked (`MDX012_EMPTY_ANCHOR`).
- **Headings**: Unique, deterministic IDs generated. Hierarchy skip (e.g., `h1` → `h3`) is blocked (`MDX015_HEADING_HIERARCHY_SKIP`).
- **Interactive UI**: Components (e.g., `CodeTabs`) inject required ARIA roles automatically.

## 6. Observability & Operations

### Test Matrix

The pipeline requires exhaustive validation to maintain its 100% coverage guarantee. The test suite must cover:

- **Unit tests per Pass**: Verifying isolated behavior, including empty or malformed ASTs.
- **Golden HTML Snapshots**: Ensuring zero visual or structural regression during refactoring.
- **Security Fixtures**: Testing XSS vectors, path traversal attempts, and resource exhaustion bounds.
- **Cross-OS Determinism**: Verifying identical artifact hashes across Windows and Linux environments.
- **Cache Invalidation**: Verifying that modified pipeline versions correctly bust the cache.
- **Concurrency Determinism**: Guaranteeing stable artifact output regardless of worker race conditions.

### Caching & Versioning Strategy

To maintain performance, expensive operations (math, highlighting) utilize an incremental cache.

- **Cache Key**: `hash(content + pipelineVersion + passVersion + dependencyVersions)`
- **Invalidation**: Updating the `PIPELINE_VERSION` constant automatically busts the cache.
- **Cache Scope**:
  - The cache is strictly scoped per post.
  - Cache entries must be content-addressed.
  - Cache hits/misses must not depend on execution order across workers.
  - Cache reads must not mutate `PostContext`.

### API / CLI Interface

- `just dev`: Runs in Warn Mode for rapid iteration.
- `just build`: Runs in Strict Mode for production safety.
- `just check`: Executes type checking and runs the pipeline validation phase to surface diagnostics early.

## 7. Content Lifecycle & SEO

### The Published Artifact Rule

**Final Invariant**: Only fully valid (no critical diagnostics in Strict Mode) and published (non-draft) posts may enter the manifest, RSS feeds, sitemaps, search indexes, or knowledge graph. **No exceptions.**

### SEO & Canonical Contract

Blog posts must adhere to strict SEO rules during the `extractionPass`:

- **Drafts**: Emits `robots: noindex, nofollow` metadata. Excluded from all downstream systems.
- **Canonical URLs**: If `canonical` is absent in frontmatter, it is deterministically generated from the slug. Duplicate canonical URLs across the workspace trigger a critical diagnostic.
- **OpenGraph**: Extracted `description`, `title`, and priority `images[0]` are mapped to OG tags.

### Output Artifact Contract

The build output is governed by a strict, versioned JSON schema.

```typescript
type ContentManifest = {
  pipelineVersion: string;
  buildEpoch?: number; // Requires SOURCE_DATE_EPOCH. Omitted if absent.
  posts: ManifestPost[];
};

type ManifestPost = {
  slug: string;
  frontmatter: Frontmatter;
  flags: FeatureFlags;
  extracted: ExtractionResult;
};
```

### Feature Flags & Chunking

Each post produces a deterministic set of flags (`hasMath`, `hasMermaid`, `hasCode`, `hasCodeTabs`, `hasImages`, `hasInteractiveBlocks`).

- **Chunking Contract**: One feature = one lazy-loaded chunk. No feature code/style is loaded globally unless required by the associated feature flags.

## 8. Final Invariants

- No unknown component reaches output.
- No raw HTML reaches output unless explicitly allowlisted.
- No invalid or draft post enters public artifacts.
- No feature runtime is loaded unless its feature flag is present.
- No generated artifact depends on current time, OS path format, or worker execution order.
