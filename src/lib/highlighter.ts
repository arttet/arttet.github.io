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

export let themeIds: string[] = [];
export let hl: Hl | null = null;
export let promise: Promise<Hl> | null = null;

export function setThemes(ids: string[]): void {
  themeIds = ids;
}

export async function getHighlighter(): Promise<Hl> {
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

export async function loadLanguage(lang: string) {
  const h = await getHighlighter();
  const safeLang: SupportedLang | 'text' = LANGS.includes(lang as SupportedLang)
    ? (lang as SupportedLang)
    : 'text';
  if (safeLang !== 'text' && !h.getLoadedLanguages().includes(safeLang)) {
    await h.loadLanguage(safeLang);
  }
}

export function highlightCode(code: string, lang: string): string {
  if (!hl || themeIds.length === 0) {
    return escHtml(code);
  }

  const safeLang: SupportedLang | 'text' = LANGS.includes(lang as SupportedLang)
    ? (lang as SupportedLang)
    : 'text';
  const themes = Object.fromEntries(themeIds.map((id) => [id, id]));

  return hl.codeToHtml(code.trim(), {
    lang: safeLang,
    themes,
    defaultColor: false,
  });
}
