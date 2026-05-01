import { codeThemes } from '../../src/shared/config/codeThemes.js';
import { processCodeTabsContent } from './passes/content/code-tabs.js';
import { processMathContent } from './passes/content/math.js';
import { insertKatexStyles, insertSvelteImports } from './passes/content/svelte-script.js';

/**
 * Compatibility layer.
 * Must run before mdsvex to preserve LaTeX backslashes and current CodeTabs behavior.
 *
 * @returns {import('svelte/compiler').PreprocessorGroup}
 */
export function markdownCompatibilityPreprocess() {
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
        imports.push("  import KaTeXStyles from '$shared/ui/KaTeXStyles.svelte';");
      }

      if (processed.includes('<StaticHtml')) {
        imports.push("  import StaticHtml from '$shared/ui/StaticHtml.svelte';");
      }

      const insertion = insertSvelteImports(processed, imports);
      processed = insertion.code;

      if (needsKaTeXStyles) {
        processed = insertKatexStyles(processed, insertion.instanceScriptOpen);
      }

      return { code: processed };
    },
  };
}
