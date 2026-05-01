import { createMarkdownEngine } from './engine.js';
import { contentPasses, securityPasses } from './pass-groups.js';

export async function createMarkdownConfig() {
  return createMarkdownEngine({
    mode: 'warn',
  })
    .use(contentPasses())
    .use(securityPasses())
    .toMdsvexConfig();
}
