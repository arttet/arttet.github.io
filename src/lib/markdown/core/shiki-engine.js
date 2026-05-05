import { createHighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import { getThemeIds, setThemes } from './shiki-config.js';
import { codeThemes } from '../../../shared/config/codeThemes.js';

/** @type {Record<string, () => Promise<{ default: unknown }>>} */
const LANG_LOADERS = {
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  svelte: () => import('@shikijs/langs/svelte'),
  rust: () => import('@shikijs/langs/rust'),
  go: () => import('@shikijs/langs/go'),
  python: () => import('@shikijs/langs/python'),
  bash: () => import('@shikijs/langs/bash'),
  sh: () => import('@shikijs/langs/bash'),
  json: () => import('@shikijs/langs/json'),
  yaml: () => import('@shikijs/langs/yaml'),
  toml: () => import('@shikijs/langs/toml'),
  css: () => import('@shikijs/langs/css'),
  html: () => import('@shikijs/langs/html'),
  markdown: () => import('@shikijs/langs/markdown'),
  sql: () => import('@shikijs/langs/sql'),
  dockerfile: () => import('@shikijs/langs/dockerfile'),
  cpp: () => import('@shikijs/langs/cpp'),
  zig: () => import('@shikijs/langs/zig'),
};

/** @type {Record<string, () => Promise<{ default: unknown }>>} */
const THEME_LOADERS = {
  'catppuccin-mocha': () => import('@shikijs/themes/catppuccin-mocha'),
  'github-dark': () => import('@shikijs/themes/github-dark'),
  'gruvbox-dark-hard': () => import('@shikijs/themes/gruvbox-dark-hard'),
  'github-light': () => import('@shikijs/themes/github-light'),
  'catppuccin-latte': () => import('@shikijs/themes/catppuccin-latte'),
  'gruvbox-light-hard': () => import('@shikijs/themes/gruvbox-light-hard'),
};

export const LANGS = Object.keys(LANG_LOADERS);
export const LANG_SET = new Set(LANGS);

/** @type {import('shiki').HighlighterCore | null} */
let hl = null;
/** @type {Promise<import('shiki').HighlighterCore> | null} */
let promise = null;
/** @type {Set<string>} */
const loadedThemes = new Set();
/** @type {Set<string>} */
const loadedLanguages = new Set();

/**
 * @returns {Promise<import('shiki').HighlighterCore>}
 */
export async function getHighlighter() {
  if (hl) {
    return hl;
  }

  if (!promise) {
    const ids = getThemeIds().length > 0 ? getThemeIds() : codeThemes.map((t) => t.id);
    setThemes(ids);
    promise = createHighlighterCore({
      engine: createOnigurumaEngine(() => import('shiki/wasm')),
    }).then(async (h) => {
      hl = h;
      await Promise.all(ids.map((id) => loadTheme(id)));
      return h;
    });
  }
  return promise;
}

/**
 * @param {string} themeId
 */
async function loadTheme(themeId) {
  if (!hl || loadedThemes.has(themeId)) {
    return;
  }
  const loader = THEME_LOADERS[themeId];
  if (!loader) {
    return;
  }
  const mod = await loader();
  await hl.loadTheme(/** @type {any} */ (mod.default));
  loadedThemes.add(themeId);
}

/**
 * @param {string} s
 * @returns {string}
 */
export function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Deterministic hash for a string.
 * @param {string} str
 * @returns {string}
 */
export function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
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
    const cls = 'shiki-' + hashString(style);
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
  if (safeLang === 'text' || loadedLanguages.has(safeLang)) {
    return;
  }
  const loader = LANG_LOADERS[safeLang];
  if (!loader) {
    return;
  }
  const mod = await loader();
  await h.loadLanguage(/** @type {any} */ (mod.default));
  loadedLanguages.add(safeLang);
}

/**
 * @param {string} code
 * @param {string} lang
 * @param {any[]} [transformers]
 * @returns {string}
 */
export function highlightCode(code, lang, transformers) {
  const ids = getThemeIds();
  if (!hl || ids.length === 0) {
    return escapeHtml(code);
  }

  const safeLang = LANG_SET.has(lang) ? lang : 'text';
  const themes = Object.fromEntries(ids.map((id) => [id, id]));

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
