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
