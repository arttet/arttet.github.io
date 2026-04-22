export async function highlightOnDemand(code: string, lang: string): Promise<string> {
  const { getHighlighter, highlightCode, loadLanguage } = await import('$lib/highlighter');
  await getHighlighter();
  await loadLanguage(lang);
  return highlightCode(code, lang);
}
