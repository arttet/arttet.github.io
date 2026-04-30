import { createDiagnostics } from './diagnostics.js';
import { markdownComponentRegistry } from './registry.js';

/**
 * @typedef {import('mdsvex').MdsvexOptions} MdsvexOptions
 * @typedef {import('./diagnostics.js').Diagnostic} Diagnostic
 */

/**
 * @typedef {'strict' | 'warn'} MarkdownMode
 */

/**
 * @typedef {Object} MarkdownPipelineContext
 * @property {MarkdownMode} mode
 * @property {ReturnType<typeof createDiagnostics>} diagnostics
 * @property {typeof markdownComponentRegistry} registry
 * @property {Record<string, unknown>} state
 */

/**
 * @typedef {Object} MarkdownStep
 * @property {string} name
 * @property {'pre' | 'remark' | 'rehype' | 'validate' | 'post' | 'extract'} phase
 * @property {string[]=} requires
 * @property {(ctx: MarkdownPipelineContext) => void | Promise<void>=} setup
 * @property {(ctx: MarkdownPipelineContext) => Partial<MdsvexOptions>=} mdsvex
 */

/**
 * @param {{ mode?: MarkdownMode }} options
 */
export function createMarkdownEngine(options = {}) {
  /** @type {MarkdownStep[]} */
  const steps = [];

  return {
    /**
     * @param {MarkdownStep} step
     */
    use(step) {
      steps.push(step);
      return this;
    },

    /**
     * @returns {Promise<MdsvexOptions>}
     */
    async toMdsvexConfig() {
      const orderedSteps = orderSteps(steps);
      const ctx = createContext(options.mode ?? 'warn');

      for (const step of orderedSteps) {
        // Step setup follows dependency order; later steps may rely on earlier setup state.
        // eslint-disable-next-line no-await-in-loop
        await step.setup?.(ctx);
      }

      return mergeMdsvexOptions(orderedSteps, ctx);
    },
  };
}

/**
 * @param {MarkdownMode} mode
 * @returns {MarkdownPipelineContext}
 */
function createContext(mode) {
  return {
    mode,
    diagnostics: createDiagnostics(),
    registry: markdownComponentRegistry,
    state: {},
  };
}

/**
 * @param {MarkdownStep[]} steps
 * @returns {MarkdownStep[]}
 */
function orderSteps(steps) {
  const names = new Set();
  for (const step of steps) {
    if (names.has(step.name)) {
      throw new Error(`Duplicate markdown step registered: ${step.name}`);
    }
    names.add(step.name);
  }

  for (const step of steps) {
    for (const dependency of step.requires ?? []) {
      if (!names.has(dependency)) {
        throw new Error(`Markdown step "${step.name}" requires missing step "${dependency}"`);
      }
    }
  }

  const pending = [...steps];
  /** @type {MarkdownStep[]} */
  const ordered = [];
  const resolved = new Set();

  while (pending.length > 0) {
    const index = pending.findIndex((step) =>
      (step.requires ?? []).every((dependency) => resolved.has(dependency))
    );

    if (index === -1) {
      throw new Error('Markdown step dependency cycle detected');
    }

    const [step] = pending.splice(index, 1);
    ordered.push(step);
    resolved.add(step.name);
  }

  return ordered;
}

/**
 * @param {MarkdownStep[]} steps
 * @param {MarkdownPipelineContext} ctx
 * @returns {MdsvexOptions}
 */
function mergeMdsvexOptions(steps, ctx) {
  /** @type {MdsvexOptions} */
  const config = {
    extensions: ['.md'],
    remarkPlugins: [],
    rehypePlugins: [],
  };

  for (const step of steps) {
    const partial = step.mdsvex?.(ctx);
    if (!partial) continue;

    config.remarkPlugins?.push(...(partial.remarkPlugins ?? []));
    config.rehypePlugins?.push(...(partial.rehypePlugins ?? []));

    if (partial.highlight) {
      if (config.highlight) {
        throw new Error(
          `Multiple markdown steps attempted to define a highlighter. Conflict in step "${step.name}".`
        );
      }
      config.highlight = partial.highlight;
    }
  }

  return config;
}
