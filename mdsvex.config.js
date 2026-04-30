import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import { getHighlighter, LANGS, setThemes } from './src/lib/highlighter.config.js';
import { codeThemes } from './src/shared/config/codeThemes.js';

setThemes(codeThemes.map((t) => t.id));

const hl = await getHighlighter();

// Pre-load all languages for synchronous mdsvex highlighting during build

const { bundledLanguages } = await import('shiki');

const shikiLanguages = /** @type {Record<string, Parameters<typeof hl.loadLanguage>[0]>} */ (
  bundledLanguages
);

await Promise.all(
  LANGS.map((lang) => {
    const loader = shikiLanguages[lang];

    return loader ? hl.loadLanguage(loader) : Promise.resolve();
  })
);

const themes = Object.fromEntries(codeThemes.map((t) => [t.id, t.id]));

/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} value
 * @property {MarkdownNode[]=} children
 */

/**
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * @param {string} html
 * @returns {string}
 */
function trustedSvelteHtml(html) {
  return `{@html ${JSON.stringify(html)}}`;
}

function remarkReadingTime() {
  /**
   * @param {MarkdownNode} tree
   * @param {{ data: { fm?: Record<string, unknown> } }} file
   */
  return (tree, file) => {
    let text = '';
    /**
     * @param {MarkdownNode} node
     */
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

/** @type {import('mdsvex').MdsvexOptions} */
const config = {
  extensions: ['.md'],
  remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
    remarkReadingTime,
  ]),
  rehypePlugins: /** @type {import('mdsvex').MdsvexOptions['rehypePlugins']} */ (
    /** @type {unknown} */ ([
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          test: ['h2'],
          properties: {
            className: ['anchor'],
            ariaHidden: true,
          },
          content: {
            type: 'text',
            value: '#',
          },
        },
      ],
    ])
  ),

  highlight: {
    /**
     * @param {string} code
     * @param {string | null | undefined} lang
     */
    highlighter(code, lang) {
      if (lang === 'mermaid') {
        const escaped = escapeHtml(code);
        const encoded = Buffer.from(code).toString('base64');
        const html = `<div class="mermaid-block not-prose relative group" data-copy-content="${encoded}" data-copy-label="Mermaid"><div class="mermaid" data-content="${encoded}">${escaped}</div></div>`;

        return trustedSvelteHtml(html);
      }

      try {
        const safeLang = LANGS.includes(lang ?? '') ? (lang ?? 'text') : 'text';

        const html = hl

          .codeToHtml(code, { lang: safeLang, themes, defaultColor: false })

          .replace('<pre ', `<pre data-language="${safeLang}" `);

        return trustedSvelteHtml(html);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Shiki highlighting failed:', e);
        const safe = escapeHtml(code);

        return trustedSvelteHtml(`<pre><code>${safe}</code></pre>`);
      }
    },
  },
};

export default config;
