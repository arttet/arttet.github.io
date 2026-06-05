// @vitest-environment node
import katex from 'katex';
import { describe, expect, it, vi } from 'vitest';
import { processMathContent } from './math.js';

describe('math pass', () => {
  it('returns text without math unchanged', () => {
    expect(processMathContent('hello world')).toBe('hello world');
  });

  it('renders display math', () => {
    const result = processMathContent('$$E = mc^2$$');
    expect(result).toContain('<MathCopy display={true}');
    const b64Latex = result.match(/b64Latex="([^"]+)"/)?.[1];
    if (!b64Latex) {
      throw new Error('b64Latex not found');
    }
    expect(Buffer.from(b64Latex, 'base64').toString('utf8')).toBe('E = mc^2');
  });

  it('renders inline math', () => {
    const result = processMathContent('$E = mc^2$');
    expect(result).toContain('<MathCopy display={false}');
    const b64Latex = result.match(/b64Latex="([^"]+)"/)?.[1];
    if (!b64Latex) {
      throw new Error('b64Latex not found');
    }
    expect(Buffer.from(b64Latex, 'base64').toString('utf8')).toBe('E = mc^2');
  });

  it('does not process math inside code blocks', () => {
    const content = '```\n$x$\n```';
    expect(processMathContent(content)).toBe(content);
  });

  it('does not process math inside inline code', () => {
    const content = 'hello `$x$` world';
    expect(processMathContent(content)).toBe(content);
  });

  it('does not process escaped inline math', () => {
    const result = processMathContent('price is \\$5');
    expect(result).not.toContain('<MathCopy');
    expect(result).toContain('\\$5');
  });

  it('falls back to code element on display math render error', () => {
    vi.spyOn(katex, 'renderToString').mockImplementationOnce(() => {
      throw new Error('fail');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = processMathContent('$$x$$');
    expect(result).toContain('<code>$$x$$</code>');
    expect(consoleSpy).toHaveBeenCalledWith('KaTeX display render failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('falls back to empty b64Html on inline math render error', () => {
    vi.spyOn(katex, 'renderToString').mockImplementationOnce(() => {
      throw new Error('fail');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = processMathContent('$x$');
    expect(result).toContain('<MathCopy display={false}');
    expect(result).toContain('b64Html=""');
    expect(consoleSpy).toHaveBeenCalledWith('KaTeX inline render failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
