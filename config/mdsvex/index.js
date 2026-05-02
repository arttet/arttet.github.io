import { createMarkdownEngine } from './engine.js';
import { contentPasses, optimizationPasses, securityPasses } from './pass-groups.js';

export async function createMarkdownConfig() {
  return createMarkdownEngine({
    mode: 'warn',
  })
    .use(contentPasses())
    .use(securityPasses())
    .use(optimizationPasses())
    .toMdsvexConfig();
}

/**
 * @returns {Promise<import('./engine.js').MarkdownPipelineContext>}
 */
export async function createMarkdownContext() {
  const { ctx } = await createMarkdownConfig();
  return ctx;
}
