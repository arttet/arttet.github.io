import { codeThemes } from '../../src/shared/config/codeThemes.js';
import { createMarkdownEngine } from './engine/index.js';
import { contentPasses, optimizationPasses, securityPasses } from './engine/pass-groups.js';
import { collectRuntimeImports } from './engine/registry.js';
import { processCodeTabsContent } from './passes/content/code-tabs.js';
import { processMathContent } from './passes/content/math.js';
import { insertSvelteImports } from './passes/content/svelte-script.js';

export async function createMarkdownConfig() {
  const { config, build } = await createMarkdownEngine({
    mode: 'warn',
  })
    .use(contentPasses())
    .use(securityPasses())
    .use(optimizationPasses())
    .toMdsvexConfig();

  return { config, build, preprocess: createMarkdownPreprocess() };
}

/**
 * @returns {import('svelte/compiler').PreprocessorGroup}
 */
function createMarkdownPreprocess() {
  return {
    async markup({ content, filename }) {
      if (!filename?.endsWith('.md')) {
        return;
      }

      let processed = processMathContent(content);
      const themes = Object.fromEntries(codeThemes.map((theme) => [theme.id, theme.id]));
      processed = await processCodeTabsContent(processed, themes);

      const imports = collectRuntimeImports(processed);
      const insertion = insertSvelteImports(processed, imports);
      processed = insertion.code;

      return { code: processed };
    },
  };
}

/**
 * @returns {Promise<import('./engine/context.js').BuildContext>}
 */
export async function createMarkdownContext() {
  const { build } = await createMarkdownConfig();
  return build;
}
