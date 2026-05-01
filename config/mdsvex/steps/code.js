import { getHighlighter, LANGS, setThemes } from '../../../src/lib/highlighter.config.js';
import { codeThemes } from '../../../src/shared/config/codeThemes.js';

/**
 * @typedef {Awaited<ReturnType<typeof getHighlighter>>} MarkdownHighlighter
 * @typedef {Parameters<MarkdownHighlighter['loadLanguage']>[0]} ShikiLanguageLoader
 */

const allowedLangs = new Set(LANGS);
const themes = Object.fromEntries(codeThemes.map((theme) => [theme.id, theme.id]));
/** @type {MarkdownHighlighter | null} */
let hl = null;
/** @type {Record<string, ShikiLanguageLoader> | null} */
let shikiLanguages = null;

export function codeStep() {
  return {
    name: 'code',
    phase: /** @type {const} */ ('rehype'),
    async setup() {
      await setupHighlighter();
    },
    mdsvex() {
      return {
        highlight: {
          /**
           * @param {string} code
           * @param {string | null | undefined} lang
           */
          highlighter(code, lang) {
            if (lang === 'mermaid') {
              return renderMermaidBlock(code);
            }

            return renderHighlightedCode(code, lang);
          },
        },
      };
    },
  };
}

async function setupHighlighter() {
  setThemes(codeThemes.map((theme) => theme.id));
  hl ??= await getHighlighter();

  if (!shikiLanguages) {
    const shiki = await import('shiki');
    shikiLanguages = /** @type {Record<string, ShikiLanguageLoader>} */ (shiki.bundledLanguages);
  }

  await preloadLanguages(hl, shikiLanguages);
}

/**
 * @returns {MarkdownHighlighter}
 */
function getConfiguredHighlighter() {
  if (!hl) {
    throw new Error('Markdown highlighter used before codeStep setup.');
  }

  return hl;
}

/**
 * @param {MarkdownHighlighter} highlighter
 * @param {Record<string, ShikiLanguageLoader>} languages
 */
async function preloadLanguages(highlighter, languages) {
  await Promise.all(
    LANGS.map((lang) => {
      const loader = languages[lang];

      if (!loader) {
        // eslint-disable-next-line no-console
        console.warn(`Unknown Shiki language configured for markdown: ${lang}`);
        return Promise.resolve();
      }

      return highlighter.loadLanguage(loader);
    })
  );
}

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
    const html = getConfiguredHighlighter().codeToHtml(code, {
      lang: safeLang,
      themes,
      defaultColor: false,
      transformers: [
        {
          pre(node) {
            node.properties['data-language'] = safeLang;
          },
        },
      ],
    });

    return trustedSvelteHtml(html);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Shiki highlighting failed:', e);
    return renderPlainCode(code);
  }
}
