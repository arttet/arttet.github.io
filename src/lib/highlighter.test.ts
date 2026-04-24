// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHl = vi.hoisted(() => ({
  getLoadedLanguages: vi.fn().mockReturnValue(['typescript']),
  loadLanguage: vi.fn().mockResolvedValue(undefined),
  codeToHtml: vi
    .fn()
    .mockImplementation((code: string) => `<pre class="shiki"><code>${code}</code></pre>`),
}));

vi.mock('shiki', () => ({
  createHighlighter: vi.fn().mockResolvedValue(mockHl),
}));

describe('highlighter logic', () => {
  let hlModule: typeof import('./highlighter');

  beforeEach(async () => {
    vi.resetModules();
    vi.doUnmock('$lib/highlighter');
    mockHl.getLoadedLanguages.mockReturnValue(['typescript']);
    mockHl.loadLanguage.mockClear();
    mockHl.codeToHtml.mockClear();

    hlModule = await import('$lib/highlighter');
  });

  it('escapes HTML when no highlighter is ready', () => {
    expect(hlModule.highlightCode('<b>', 'ts')).toBe('&lt;b&gt;');
  });

  it('loads a supported language that is not loaded yet', async () => {
    hlModule.setThemes(['github-dark']);
    await hlModule.getHighlighter();
    await hlModule.loadLanguage('rust');

    expect(mockHl.getLoadedLanguages).toHaveBeenCalled();
    expect(mockHl.loadLanguage).toHaveBeenCalledWith('rust');
  });
});
