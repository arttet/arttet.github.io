import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import { getHighlighter, LANGS, setThemes } from './src/lib/highlighter.config.js';
import { codeThemes } from './src/shared/config/codeThemes.js';

setThemes(codeThemes.map((t) => t.id));

const hl = await getHighlighter();
const { bundledLanguages } = await import('shiki');

const shikiLanguages = /** @type {Record<string, Parameters<typeof hl.loadLanguage>[0]>} */ (
  bundledLanguages
);
const allowedLangs = new Set(LANGS);
const themes = Object.fromEntries(codeThemes.map((t) => [t.id, t.id]));

await preloadLanguages();

/** @type {import('mdsvex').MdsvexOptions} */
const config = {
  extensions: ['.md'],
  remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
    remarkReadingTime,
  ]),
  rehypePlugins: getRehypePlugins(),

  highlight: {
    highlighter(code, lang) {
      if (lang === 'mermaid') {
        return renderMermaidBlock(code);
      }

      return renderHighlightedCode(code, lang);
    },
  },
};

export default config;

async function preloadLanguages() {
  await Promise.all(
    LANGS.map((lang) => {
      const loader = shikiLanguages[lang];

      if (!loader) {
        // eslint-disable-next-line no-console
        console.warn(`Unknown Shiki language configured for markdown: ${lang}`);
        return Promise.resolve();
      }

      return hl.loadLanguage(loader);
    })
  );
}

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
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * @param {string} value
 * @returns {string}
 */
function encodeBase64(value) {
  return Buffer.from(value).toString('base64');
}

/**
 * @param {string} html
 * @returns {string}
 */
function trustedSvelteHtml(html) {
  return `{@html ${JSON.stringify(html)}}`;
}

/**
 * @param {string | null | undefined} lang
 * @returns {string}
 */
function normalizeLang(lang) {
  const candidate = lang ?? '';
  return allowedLangs.has(candidate) ? candidate : 'text';
}

/**
 * @param {string} code
 * @returns {string}
 */
function renderPlainCode(code) {
  const safe = escapeHtml(code);
  return trustedSvelteHtml(`<pre><code>${safe}</code></pre>`);
}

/**
 * @param {string} code
 * @returns {string}
 */
function renderMermaidBlock(code) {
  const escaped = escapeHtml(code);
  const encoded = encodeBase64(code);
  const html = `<div class="mermaid-block not-prose relative group" data-copy-content="${encoded}" data-copy-label="Mermaid"><div class="mermaid" data-content="${encoded}">${escaped}</div></div>`;

  return trustedSvelteHtml(html);
}

/**
 * @param {string} code
 * @param {string | null | undefined} lang
 * @returns {string}
 */
function renderHighlightedCode(code, lang) {
  try {
    const safeLang = normalizeLang(lang);
    const html = hl

      .codeToHtml(code, { lang: safeLang, themes, defaultColor: false })

      .replace('<pre ', `<pre data-language="${safeLang}" `);

    return trustedSvelteHtml(html);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Shiki highlighting failed:', e);
    return renderPlainCode(code);
  }
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

/**
 * @returns {import('mdsvex').MdsvexOptions['rehypePlugins']}
 */
function getRehypePlugins() {
  return /** @type {import('mdsvex').MdsvexOptions['rehypePlugins']} */ (
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
  );
}
