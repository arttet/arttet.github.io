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
    const ids = themeIds;
    const { createHighlighter } = await import('shiki');
    promise = createHighlighter({
      themes: ids,
      langs: [],
    }).then((h) => {
      hl = h;
      return h;
    });
  }
  return promise;
}
