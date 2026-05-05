// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockHl = vi.hoisted(() => ({
  loadLanguage: vi.fn().mockResolvedValue(undefined),
  loadTheme: vi.fn().mockResolvedValue(undefined),
  codeToHtml: vi
    .fn()
    .mockImplementation((code: string) => `<pre class="shiki"><code>${code}</code></pre>`),
}));

const mockEngine = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('shiki/core', () => ({
  createHighlighterCore: vi.fn().mockResolvedValue(mockHl),
}));

vi.mock('shiki/engine/oniguruma', () => ({
  createOnigurumaEngine: vi.fn().mockReturnValue(mockEngine),
}));

vi.mock('shiki/wasm', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@shikijs/langs/rust', () => ({
  default: { id: 'rust', name: 'Rust' },
}));

vi.mock('@shikijs/themes/github-dark', () => ({
  default: { name: 'github-dark', bg: '#0d1117', fg: '#c9d1d9', settings: [] },
}));

describe('highlighter logic', () => {
  let hlModule: typeof import('./highlighter');

  beforeEach(async () => {
    vi.resetModules();
    vi.doUnmock('./highlighter');
    mockHl.loadLanguage.mockClear();
    mockHl.loadTheme.mockClear();
    mockHl.codeToHtml.mockClear();
    mockEngine.mockClear();

    hlModule = await import('./highlighter');
  });

  it('escapes HTML when no highlighter is ready', () => {
    expect(hlModule.highlightCode('<b>', 'ts')).toBe('&lt;b&gt;');
  });

  it('loads a supported language that is not loaded yet', async () => {
    hlModule.setThemes(['github-dark']);
    await hlModule.getHighlighter();
    await hlModule.loadLanguage('rust');

    expect(mockHl.loadLanguage).toHaveBeenCalledWith(expect.objectContaining({ id: 'rust' }));
  });

  it('highlights code when highlighter is ready', async () => {
    hlModule.setThemes(['github-dark']);
    await hlModule.getHighlighter();

    const result = hlModule.highlightCode('let x = 1;', 'typescript');
    expect(result).toContain('<pre class="shiki">');
    expect(mockHl.codeToHtml).toHaveBeenCalled();
  });
});
