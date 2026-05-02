/**
 * Frozen single-source-of-truth constants for the markdown pipeline.
 *
 * Every diagnostic code, severity, phase, mode, protocol, kind, feature flag,
 * and artifact filename used by the pipeline is declared here so callers
 * reference symbols, not literals.
 *
 * @typedef {typeof DIAGNOSTIC_CODES[keyof typeof DIAGNOSTIC_CODES]} DiagnosticCode
 * @typedef {typeof SEVERITY[keyof typeof SEVERITY]} Severity
 * @typedef {typeof PASS_PHASES[keyof typeof PASS_PHASES]} PassPhase
 * @typedef {typeof VALIDATION_MODE[keyof typeof VALIDATION_MODE]} ValidationMode
 * @typedef {typeof COMPONENT_KIND[keyof typeof COMPONENT_KIND]} ComponentKind
 * @typedef {typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS]} FeatureFlag
 */

export const DIAGNOSTIC_CODES = Object.freeze({
  UNKNOWN_COMPONENT: 'MDX001_UNKNOWN_COMPONENT',
  UNSAFE_URL: 'MDX002_UNSAFE_URL',
  RAW_HTML: 'MDX003_RAW_HTML',
  UNSAFE_EVENT_HANDLER: 'MDX004_UNSAFE_EVENT_HANDLER',
  UNKNOWN_COMPONENT_PROP: 'MDX005_UNKNOWN_COMPONENT_PROP',
  IMAGE_MISSING_ALT: 'MDX006_IMAGE_MISSING_ALT',
  DUPLICATE_SLUG: 'MDX007_DUPLICATE_SLUG',
  DUPLICATE_HEADING: 'MDX008_DUPLICATE_HEADING',
  LINK_TO_HIDDEN: 'MDX009_LINK_TO_HIDDEN',
  INVALID_FRONTMATTER: 'MDX010_INVALID_FRONTMATTER',
  BROKEN_INTERNAL_LINK: 'MDX011_BROKEN_INTERNAL_LINK',
  EMPTY_ANCHOR: 'MDX012_EMPTY_ANCHOR',
  MULTIPLE_H1: 'MDX014_MULTIPLE_H1',
  HEADING_HIERARCHY_SKIP: 'MDX015_HEADING_HIERARCHY_SKIP',
});

export const SEVERITY = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
});

export const PASS_PHASES = Object.freeze({
  PRE: 'pre',
  REMARK: 'remark',
  REHYPE: 'rehype',
  VALIDATE: 'validate',
  POST: 'post',
  EXTRACT: 'extract',
});

export const VALIDATION_MODE = Object.freeze({
  WARN: 'warn',
  STRICT: 'strict',
});

export const SAFE_PROTOCOLS = Object.freeze(['http://', 'https://', 'mailto:', 'tel:', 'sms:']);

export const COMPONENT_KIND = Object.freeze({
  BLOCK: 'block',
  INLINE: 'inline',
});

export const FEATURE_FLAGS = Object.freeze({
  HAS_MATH: 'hasMath',
  HAS_MERMAID: 'hasMermaid',
  HAS_CODE: 'hasCode',
  HAS_CODE_TABS: 'hasCodeTabs',
  HAS_IMAGES: 'hasImages',
  HAS_OPTIMIZED_IMAGES: 'hasOptimizedImages',
  HAS_PRIORITY_IMAGE: 'hasPriorityImage',
  HAS_IMAGE_LIGHTBOX: 'hasImageLightbox',
  HAS_INTERACTIVE_BLOCKS: 'hasInteractiveBlocks',
});

export const ARTIFACTS = Object.freeze({
  MANIFEST: 'content-manifest.json',
  GRAPH: 'knowledge-graph.json',
  DIAG_JSON: 'diagnostics.json',
  DIAG_MD: 'diagnostics.md',
});

export const PIPELINE_VERSION = 'sprint-7-manifest-v1';
export const KNOWLEDGE_GRAPH_VERSION = 'sprint-7-knowledge-graph-v1';

/**
 * Tags that may never appear as raw HTML in markdown output.
 * Consumed by both the registry (allowlist negative) and the security guard.
 */
export const BLOCKED_HTML_TAGS = Object.freeze(
  new Set(['script', 'style', 'iframe', 'object', 'embed', 'img'])
);
