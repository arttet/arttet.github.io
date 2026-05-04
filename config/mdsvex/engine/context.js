import { createDiagnostics } from './diagnostics.js';
import { markdownComponentRegistry } from './registry.js';
import { PIPELINE_VERSION } from '../constants.js';

/**
 * @typedef {import('mdsvex').MdsvexOptions} MdsvexOptions
 * @typedef {import('./diagnostics.js').Diagnostic} Diagnostic
 */

/**
 * @typedef {import('../constants.js').ValidationMode} MarkdownMode
 */

/**
 * Typed pipeline state shared across passes.
 * Every key must be explicitly declared so reads/writes are statically traceable.
 *
 * @typedef {Object} PipelineState
 * @property {Set<string>} [knownSlugs]  populated by linksPass setup
 * @property {Set<string>} [draftSlugs]  populated by linksPass setup
 */

/**
 * @typedef {Object} BuildContext
 * @property {MarkdownMode} mode
 * @property {string} pipelineVersion
 * @property {typeof markdownComponentRegistry} registry
 * @property {Record<string, string>} dependencyVersions
 * @property {Map<string, PostContext>} postContexts
 * @property {ReturnType<typeof createDiagnostics>} diagnostics
 * @property {PipelineState} state
 */

/**
 * @typedef {Object} PostContext
 * @property {string} file
 * @property {ReturnType<typeof createDiagnostics>} diagnostics
 * @property {PipelineState} state
 */

/**
 * @typedef {Object} MarkdownPass
 * @property {string} name
 * @property {import('../constants.js').PassPhase} phase
 * @property {string[]=} requires
 * @property {(build: BuildContext) => void | Promise<void>=} setup
 * @property {(build: BuildContext) => Partial<MdsvexOptions>=} mdsvex
 */

/**
 * Build a fresh shared build context for a single engine invocation.
 *
 * @param {MarkdownMode} mode
 * @returns {BuildContext}
 */
export function createBuildContext(mode) {
  return {
    mode,
    pipelineVersion: PIPELINE_VERSION,
    registry: markdownComponentRegistry,
    dependencyVersions: {},
    postContexts: new Map(),
    diagnostics: createDiagnostics(),
    state: createPipelineState(),
  };
}

/**
 * Build an isolated per-post context.
 *
 * @param {string} file
 * @returns {PostContext}
 */
export function createPostContext(file) {
  return {
    file,
    diagnostics: createDiagnostics(),
    state: createPipelineState(),
  };
}

/**
 * Create an empty typed pipeline state.
 * @returns {PipelineState}
 */
function createPipelineState() {
  return {};
}

/**
 * Read a value from typed pipeline state.
 *
 * @template {keyof PipelineState} K
 * @param {PipelineState} state
 * @param {K} key
 * @returns {PipelineState[K]}
 */
export function stateRead(state, key) {
  return state[key];
}

/**
 * Write a value into typed pipeline state.
 *
 * @template {keyof PipelineState} K
 * @param {PipelineState} state
 * @param {K} key
 * @param {PipelineState[K]} value
 */
export function stateWrite(state, key, value) {
  state[key] = value;
}

/**
 * Resolve the effective pass context for a given file path.
 * Returns the per-post context when available; otherwise falls back to the
 * shared build context (used in tests that bypass scanPosts).
 *
 * @param {BuildContext} build
 * @param {string} [filePath]
 * @returns {{ mode: MarkdownMode; diagnostics: ReturnType<typeof createDiagnostics>; state: PipelineState; registry: typeof markdownComponentRegistry }}
 */
export function resolvePassContext(build, filePath) {
  const postCtx = filePath ? build.postContexts.get(filePath) : undefined;
  if (postCtx) {
    return {
      mode: build.mode,
      diagnostics: postCtx.diagnostics,
      state: { ...build.state, ...postCtx.state },
      registry: build.registry,
    };
  }
  return {
    mode: build.mode,
    diagnostics: build.diagnostics,
    state: build.state,
    registry: build.registry,
  };
}
