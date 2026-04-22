import { getHighlighter, LANGS, setThemes } from './src/lib/highlighter.config.js';
import { codeThemes } from './src/shared/config/codeThemes.js';

setThemes(codeThemes.map((t) => t.id));

const hl = await getHighlighter();

// Pre-load all languages for synchronous mdsvex highlighting during build

const { bundledLanguages } = await import('shiki');

await Promise.all(
  LANGS.map((lang) => {
    const loader = bundledLanguages[lang];

    return loader ? hl.loadLanguage(loader) : Promise.resolve();
  })
);

const themes = Object.fromEntries(codeThemes.map((t) => [t.id, t.id]));

/** @type {import('mdsvex').MdsvexOptions} */

function remarkReadingTime() {
  return (tree, file) => {
    let text = '';
    function walk(node) {
      if (node.type === 'text' || node.type === 'inlineCode') {
        text += `${node.value} `;
      }
      if (node.children) {
        node.children.forEach(walk);
      }
    }
    walk(tree);
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    const readingTime = Math.max(1, Math.round(words / 200));

    if (!file.data.fm) {
      file.data.fm = {};
    }
    file.data.fm.readingTime = readingTime;
  };
}

const config = {
  extensions: ['.md'],
  remarkPlugins: [remarkReadingTime],

  highlight: {
    highlighter(code, lang) {
      if (lang === 'mermaid') {
        const escaped = code.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
        const encoded = Buffer.from(code).toString('base64');

        return `{@html \`<div class="mermaid-block not-prose relative group" data-copy-content="${encoded}" data-copy-label="Mermaid"><div class="mermaid" data-content="${encoded}">${escaped}</div></div>\`}`;
      }

      try {
        const safeLang = LANGS.includes(lang ?? '') ? (lang ?? 'text') : 'text';

        const html = hl

          .codeToHtml(code, { lang: safeLang, themes, defaultColor: false })

          .replace('<pre ', `<pre data-language="${safeLang}" `);

        const escaped = html.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

        return `{@html \`${escaped}\`}`;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Shiki highlighting failed:', e);
        const safe = code.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

        return `{@html \`<pre><code>${safe}</code></pre>\`}`;
      }
    },
  },
};

export default config;
