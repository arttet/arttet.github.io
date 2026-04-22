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

/** @type {string[]} */
let _themeIds = [];
/** @type {import('shiki').Highlighter | null} */
let _hl = null;
/** @type {Promise<import('shiki').Highlighter> | null} */
let _promise = null;

/**
 * @param {string[]} ids
 */
export function setThemes(ids) {
  _themeIds = ids;
}

/**
 * @returns {Promise<import('shiki').Highlighter>}
 */
export async function getHighlighter() {
  if (_hl) {
    return _hl;
  }
  if (!_promise) {
    const ids = _themeIds;
    const { createHighlighter } = await import('shiki');
    _promise = createHighlighter({
      themes: ids,
      langs: [],
    }).then((h) => {
      _hl = h;
      return h;
    });
  }
  return _promise;
}
