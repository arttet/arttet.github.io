import { codeThemes } from '../shared/config/codeThemes.js';

export const LANGS = [
  'javascript',
  'typescript',
  'svelte',
  'rust',
  'go',
  'python',
  'bash',
  'sh',
  'json',
  'yaml',
  'toml',
  'css',
  'html',
  'markdown',
  'sql',
  'dockerfile',
  'cpp',
  'zig',
];

export const LANG_SET = new Set(LANGS);

/** @type {string[]} */
let themeIds = [];
/** @type {import('shiki').Highlighter | null} */
let hl = null;
/** @type {Promise<import('shiki').Highlighter> | null} */
let promise = null;

/**
 * @param {string[]} ids
 */
export function setThemes(ids) {
  themeIds = ids;
}

/**
 * @returns {Promise<import('shiki').Highlighter>}
 */
export async function getHighlighter() {
  if (hl) {
    return hl;
  }

  if (!promise) {
    const ids = themeIds.length > 0 ? themeIds : codeThemes.map((t) => t.id);
    const { createHighlighter } = await import('shiki');
    promise = createHighlighter({
      themes: ids,
      langs: [],
    }).then((h) => {
      hl = h;
      themeIds = ids;
      return h;
    });
  }
  return promise;
}

/**
 * @param {string} s
 * @returns {string}
 */
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Deterministic hash for a style string.
 * @param {string} str
 * @returns {string}
 */
function hashStyle(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return 'shiki-' + (h >>> 0).toString(36);
}

/**
 * Replace repeated inline `style` attributes on `<span>` tokens with
 * shared CSS classes and emit a single `<style>` block for this chunk.
 * @param {string} html
 * @returns {string}
 */
function dedupeInlineStyles(html) {
  /** @type {string[]} */
  const rules = [];
  const seen = new Set();

  const body = html.replace(/<span([^>]*) style="([^"]*)"([^>]*)>/g, (match, pre, style, post) => {
    const cls = hashStyle(style);
    if (!seen.has(cls)) {
      seen.add(cls);
      rules.push('.' + cls + '{' + style + '}');
    }
    return '<span' + pre + ' class="' + cls + '"' + post + '>';
  });

  if (rules.length === 0) {
    return body;
  }

  return '<style>' + rules.join('') + '</style>' + body;
}

/**
 * @param {string} lang
 */
export async function loadLanguage(lang) {
  const h = await getHighlighter();
  const safeLang = LANG_SET.has(lang) ? lang : 'text';
  if (safeLang !== 'text' && !h.getLoadedLanguages().includes(safeLang)) {
    await h.loadLanguage(/** @type {import('shiki').BundledLanguage} */ (safeLang));
  }
}

/**
 * @param {string} code
 * @param {string} lang
 * @param {any[]} [transformers]
 * @returns {string}
 */
export function highlightCode(code, lang, transformers) {
  if (!hl || themeIds.length === 0) {
    return escHtml(code);
  }

  const safeLang = LANG_SET.has(lang) ? lang : 'text';
  const themes = Object.fromEntries(themeIds.map((id) => [id, id]));

  const html = hl.codeToHtml(code.trim(), {
    lang: safeLang,
    themes,
    defaultColor: false,
    transformers,
  });
  return dedupeInlineStyles(html);
}

/**
 * @param {string} code
 * @param {string} lang
 * @returns {Promise<string>}
 */
export async function highlightOnDemand(code, lang) {
  await getHighlighter();
  await loadLanguage(lang);
  return highlightCode(code, lang);
}
