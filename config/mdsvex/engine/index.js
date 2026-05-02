import { deepFreeze, VALIDATION_MODE } from '../constants.js';
import { createContext } from './context.js';

/**
 * @typedef {import('./context.js').MarkdownMode} MarkdownMode
 * @typedef {import('./context.js').MarkdownPipelineContext} MarkdownPipelineContext
 * @typedef {import('./context.js').PassContext} PassContext
 * @typedef {import('./context.js').MarkdownPass} MarkdownPass
 * @typedef {import('./diagnostics.js').Diagnostic} Diagnostic
 * @typedef {import('mdsvex').MdsvexOptions} MdsvexOptions
 */

/**
 * @param {{ mode?: MarkdownMode }} options
 */
export function createMarkdownEngine(options = {}) {
  /** @type {MarkdownPass[]} */
  const passes = [];

  return {
    /**
     * @param {MarkdownPass | readonly MarkdownPass[]} pass
     */
    use(pass) {
      const items = (Array.isArray(pass) ? pass : [pass]).filter(Boolean);
      for (const item of items) {
        if (typeof item.name !== 'string') {
          throw new TypeError(
            `Invalid markdown pass: expected object with "name", received ${item}`
          );
        }
      }
      passes.push(...items.map((item) => deepFreeze(item)));
      return this;
    },

    /**
     * @returns {Promise<{ config: MdsvexOptions; ctx: MarkdownPipelineContext }>}
     */
    async toMdsvexConfig() {
      const orderedPasses = orderPasses([...passes]);
      Object.freeze(passes);
      const ctx = createContext(options.mode ?? VALIDATION_MODE.WARN);

      for (const pass of orderedPasses) {
        // Pass setup follows dependency order; later passes may rely on earlier setup state.
        // eslint-disable-next-line no-await-in-loop
        await pass.setup?.(ctx);
      }

      return { config: mergeMdsvexOptions(orderedPasses, ctx), ctx };
    },
  };
}

/**
 * @param {MarkdownPass[]} passes
 * @returns {MarkdownPass[]}
 */
function orderPasses(passes) {
  const names = new Set();
  for (const pass of passes) {
    if (names.has(pass.name)) {
      throw new Error(`Duplicate markdown pass registered: ${pass.name}`);
    }
    names.add(pass.name);
  }

  for (const pass of passes) {
    for (const dependency of pass.requires ?? []) {
      if (!names.has(dependency)) {
        throw new Error(`Markdown pass "${pass.name}" requires missing pass "${dependency}"`);
      }
    }
  }

  const pending = [...passes];
  /** @type {MarkdownPass[]} */
  const ordered = [];
  const resolved = new Set();

  while (pending.length > 0) {
    const index = pending.findIndex((pass) =>
      (pass.requires ?? []).every((dependency) => resolved.has(dependency))
    );

    if (index === -1) {
      throw new Error('Markdown pass dependency cycle detected');
    }

    const [pass] = pending.splice(index, 1);
    ordered.push(pass);
    resolved.add(pass.name);
  }

  return ordered;
}

/**
 * @param {MarkdownPass[]} passes
 * @param {MarkdownPipelineContext} ctx
 * @returns {MdsvexOptions}
 */
function mergeMdsvexOptions(passes, ctx) {
  /** @type {MdsvexOptions} */
  const config = {
    extensions: ['.md'],
    remarkPlugins: [],
    rehypePlugins: [],
  };

  for (const pass of passes) {
    const partial = pass.mdsvex?.(ctx);
    if (!partial) continue;

    config.remarkPlugins?.push(...(partial.remarkPlugins ?? []));
    config.rehypePlugins?.push(...(partial.rehypePlugins ?? []));

    if (partial.highlight) {
      if (config.highlight) {
        throw new Error(
          `Multiple markdown passes attempted to define a highlighter. Conflict in pass "${pass.name}".`
        );
      }
      config.highlight = partial.highlight;
    }
  }

  return config;
}
