import { highlightOnDemand } from './highlight';

export function useHighlighter() {
  let highlighted = $state<string>('');
  let isLoading = $state(false);

  async function highlight(code: string, lang: string) {
    if (!code.trim()) {
      highlighted = '';
      return;
    }

    isLoading = true;
    try {
      const html = await highlightOnDemand(code, lang);
      highlighted = html;
    } catch (e) {
      console.error('Highlighter failed:', e);
    } finally {
      isLoading = false;
    }
  }

  return {
    get value() {
      return highlighted;
    },
    get loading() {
      return isLoading;
    },
    highlight,
  };
}
