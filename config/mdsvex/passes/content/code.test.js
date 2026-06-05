// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  getHighlighter,
  highlightCode,
  loadLanguage,
} from '../../../../src/lib/markdown/core/shiki-engine.js';
import { codePass } from './code.js';

vi.mock('../../../../src/lib/markdown/core/shiki-engine.js', () => ({
  getHighlighter: vi.fn().mockResolvedValue({
    loadLanguage: vi.fn().mockResolvedValue(undefined),
  }),
  highlightCode: vi.fn().mockReturnValue('<pre class="shiki"><code>highlighted</code></pre>'),
  loadLanguage: vi.fn().mockResolvedValue(undefined),
  LANGS: ['typescript', 'go', 'rust'],
  LANG_SET: new Set(['typescript', 'go', 'rust']),
  escapeHtml: /** @param {string} s */ (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
}));

vi.mock('../../../../src/lib/markdown/core/shiki-config.js', () => ({
  setThemes: vi.fn(),
}));

describe('code pass', () => {
  it('returns pass metadata', () => {
    const pass = codePass();
    expect(pass.name).toBe('code');
    expect(pass.phase).toBe('rehype');
    expect(typeof pass.setup).toBe('function');
    expect(typeof pass.mdsvex).toBe('function');
  });

  it('setup initializes highlighter and loads languages', async () => {
    const pass = codePass();
    await pass.setup();
    expect(getHighlighter).toHaveBeenCalled();
    expect(loadLanguage).toHaveBeenCalledTimes(3);
    expect(loadLanguage).toHaveBeenCalledWith('typescript');
    expect(loadLanguage).toHaveBeenCalledWith('go');
    expect(loadLanguage).toHaveBeenCalledWith('rust');
  });

  it('highlights code with a known language', () => {
    const { highlight } = codePass().mdsvex();
    const result = highlight.highlighter('const x = 1;', 'typescript');
    expect(result).toContain('{@html');
    expect(result).toContain('shiki');
    expect(highlightCode).toHaveBeenCalledWith('const x = 1;', 'typescript', expect.any(Array));
  });

  it('renders mermaid block for mermaid language', () => {
    const { highlight } = codePass().mdsvex();
    const code = 'graph TD;\n  A-->B;';
    const result = highlight.highlighter(code, 'mermaid');
    expect(result).toContain('{@html');
    expect(result).toContain('mermaid-block');
    expect(result).toContain('data-copy-content=');
    expect(result).toContain('data-copy-label=');
    expect(result).toContain('data-content=');
    expect(result).toContain(Buffer.from(code).toString('base64'));
    expect(result).toContain('graph TD;');
    expect(result).toContain('A--&gt;B;');
  });

  it('normalizes unknown language to text', () => {
    const { highlight } = codePass().mdsvex();
    /** @type {import('vitest').Mock} */ (highlightCode).mockClear();
    highlight.highlighter('hello', 'unknown');
    expect(highlightCode).toHaveBeenCalledWith('hello', 'text', expect.any(Array));
  });

  it('normalizes null language to text', () => {
    const { highlight } = codePass().mdsvex();
    /** @type {import('vitest').Mock} */ (highlightCode).mockClear();
    highlight.highlighter('hello', null);
    expect(highlightCode).toHaveBeenCalledWith('hello', 'text', expect.any(Array));
  });

  it('normalizes undefined language to text', () => {
    const { highlight } = codePass().mdsvex();
    /** @type {import('vitest').Mock} */ (highlightCode).mockClear();
    highlight.highlighter('hello', undefined);
    expect(highlightCode).toHaveBeenCalledWith('hello', 'text', expect.any(Array));
  });

  it('falls back to plain code when highlighting throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    /** @type {import('vitest').Mock} */ (highlightCode).mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const { highlight } = codePass().mdsvex();
    const result = highlight.highlighter('<bad>', 'typescript');
    expect(result).toContain('<pre><code>');
    expect(result).toContain('&lt;bad&gt;');
    expect(consoleSpy).toHaveBeenCalledWith('Shiki highlighting failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
