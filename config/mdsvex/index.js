import { codeThemes } from '../../src/shared/config/codeThemes.js';
import { createMarkdownEngine } from './engine/index.js';
import { contentPasses, optimizationPasses, securityPasses } from './engine/pass-groups.js';
import { processCodeTabsContent } from './passes/content/code-tabs.js';
import { processMathContent } from './passes/content/math.js';
import { insertSvelteImports } from './passes/content/svelte-script.js';

export async function createMarkdownConfig() {
  const { config, ctx } = await createMarkdownEngine({
    mode: 'warn',
  })
    .use(contentPasses())
    .use(securityPasses())
    .use(optimizationPasses())
    .toMdsvexConfig();

  return { config, ctx, preprocess: createMarkdownPreprocess() };
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

      /** @type {string[]} */
      const imports = [];
      const needsKaTeXStyles = processed.includes('<MathCopy');

      if (needsKaTeXStyles) {
        imports.push("  import MathCopy from '$shared/ui/MathCopy.svelte';");
      }

      const insertion = insertSvelteImports(processed, imports);
      processed = insertion.code;

      return { code: processed };
    },
  };
}

/**
 * @returns {Promise<import('./engine/index.js').MarkdownPipelineContext>}
 */
export async function createMarkdownContext() {
  const { ctx } = await createMarkdownConfig();
  return ctx;
}
