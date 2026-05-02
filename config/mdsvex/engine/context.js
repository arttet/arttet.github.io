import { createDiagnostics } from './diagnostics.js';
import { markdownComponentRegistry } from './registry.js';

/**
 * @typedef {import('mdsvex').MdsvexOptions} MdsvexOptions
 * @typedef {import('./diagnostics.js').Diagnostic} Diagnostic
 */

/**
 * @typedef {import('../constants.js').ValidationMode} MarkdownMode
 */

/**
 * @typedef {Object} MarkdownPipelineContext
 * @property {MarkdownMode} mode
 * @property {ReturnType<typeof createDiagnostics>} diagnostics
 * @property {typeof markdownComponentRegistry} registry
 * @property {Record<string, unknown>} state
 */

/**
 * Alias for {@link MarkdownPipelineContext} — the canonical name used by passes.
 *
 * @typedef {MarkdownPipelineContext} PassContext
 */

/**
 * @typedef {Object} MarkdownPass
 * @property {string} name
 * @property {import('../constants.js').PassPhase} phase
 * @property {string[]=} requires
 * @property {(ctx: MarkdownPipelineContext) => void | Promise<void>=} setup
 * @property {(ctx: MarkdownPipelineContext) => Partial<MdsvexOptions>=} mdsvex
 */

/**
 * Build a fresh pipeline context for a single engine invocation.
 *
 * @param {MarkdownMode} mode
 * @returns {MarkdownPipelineContext}
 */
export function createContext(mode) {
  return {
    mode,
    diagnostics: createDiagnostics(),
    registry: markdownComponentRegistry,
    state: {},
  };
}
