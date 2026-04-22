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
] as const;

export function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type Hl = import('shiki').Highlighter;
type SupportedLang = (typeof LANGS)[number];

export let _themeIds: string[] = [];
export let _hl: Hl | null = null;
export let _promise: Promise<Hl> | null = null;

export function setThemes(ids: string[]): void {
  _themeIds = ids;
}

export async function getHighlighter(): Promise<Hl> {
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

export async function loadLanguage(lang: string) {
  const hl = await getHighlighter();
  const safeLang: SupportedLang | 'text' = LANGS.includes(lang as SupportedLang)
    ? (lang as SupportedLang)
    : 'text';
  if (safeLang !== 'text' && !hl.getLoadedLanguages().includes(safeLang)) {
    await hl.loadLanguage(safeLang);
  }
}

export function highlightCode(code: string, lang: string): string {
  if (!_hl || _themeIds.length === 0) {
    return escHtml(code);
  }

  const safeLang: SupportedLang | 'text' = LANGS.includes(lang as SupportedLang)
    ? (lang as SupportedLang)
    : 'text';
  const themes = Object.fromEntries(_themeIds.map((id) => [id, id]));

  return _hl.codeToHtml(code.trim(), {
    lang: safeLang,
    themes,
    defaultColor: false,
  });
}
