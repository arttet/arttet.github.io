import {
  getHighlighter,
  highlightCode,
  LANGS,
  LANG_SET,
  loadLanguage,
} from '../../../../src/lib/markdown/core/shiki-engine.js';
import { setThemes } from '../../../../src/lib/markdown/core/shiki-config.js';
import { codeThemes } from '../../../../src/shared/config/codeThemes.js';
import { escapeHtml } from '../_internal/preprocess-utils.js';

/**
 * @typedef {Awaited<ReturnType<typeof getHighlighter>>} MarkdownHighlighter
 * @typedef {Parameters<MarkdownHighlighter['loadLanguage']>[0]} ShikiLanguageLoader
 */

const allowedLangs = LANG_SET;
/** @type {MarkdownHighlighter | null} */
let hl = null;

export function codePass() {
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
  await Promise.all(LANGS.map((lang) => loadLanguage(lang)));
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
    const html = highlightCode(code, safeLang, [
      {
        /** @param {any} node */
        pre(node) {
          node.properties['data-language'] = safeLang;
        },
      },
    ]);

    return trustedSvelteHtml(html);
  } catch (e) {
    console.error('Shiki highlighting failed:', e);
    return renderPlainCode(code);
  }
}
