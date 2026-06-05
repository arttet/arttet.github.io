// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readingTimePass } from './reading-time.js';

/**
 * @param {import('../_internal/walk.js').MarkdownNode[]} children
 * @param {Record<string, unknown>} [existingFm]
 */
function runReadingTime(children, existingFm) {
  const file = /** @type {{ data: { fm?: Record<string, unknown> } }} */ ({
    data: { fm: existingFm },
  });
  const plugins = /** @type {any[]} */ (readingTimePass().mdsvex().remarkPlugins);
  const plugin = /** @type {() => (tree: unknown, file: unknown) => void} */ (plugins[0]);
  const transformer = plugin();
  transformer({ type: 'root', children }, file);
  return /** @type {Record<string, unknown>} */ (file.data.fm);
}

describe('reading-time pass', () => {
  it('returns pass metadata', () => {
    const pass = readingTimePass();
    expect(pass.name).toBe('reading-time');
    expect(pass.phase).toBe('remark');
  });

  it('calculates minimum of 1 minute for empty content', () => {
    const fm = runReadingTime([]);
    expect(fm.readingTime).toBe(1);
  });

  it('counts words in text nodes', () => {
    const fm = runReadingTime([
      { type: 'paragraph', children: [{ type: 'text', value: 'one two three four five' }] },
    ]);
    expect(fm.readingTime).toBe(1);
  });

  it('estimates 2 minutes for 400 words', () => {
    const fm = runReadingTime([
      {
        type: 'paragraph',
        children: [{ type: 'text', value: 'word '.repeat(400).trim() }],
      },
    ]);
    expect(fm.readingTime).toBe(2);
  });

  it('counts inlineCode as words', () => {
    const fm = runReadingTime([
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'hello ' },
          { type: 'inlineCode', value: 'world' },
        ],
      },
    ]);
    expect(fm.readingTime).toBe(1);
  });

  it('ignores non-text nodes', () => {
    const fm = runReadingTime([
      { type: 'image', url: 'x.png', alt: 'img' },
      { type: 'code', lang: 'js', value: 'const x = 1;' },
    ]);
    expect(fm.readingTime).toBe(1);
  });

  it('creates fm object when missing', () => {
    const file = /** @type {{ data: { fm?: Record<string, unknown> } }} */ ({ data: {} });
    const plugins = /** @type {any[]} */ (readingTimePass().mdsvex().remarkPlugins);
    const plugin = /** @type {() => (tree: unknown, file: unknown) => void} */ (plugins[0]);
    const transformer = plugin();
    transformer({ type: 'root', children: [] }, file);
    expect(file.data.fm).toBeDefined();
    expect(file.data.fm?.readingTime).toBe(1);
  });

  it('preserves existing fm properties', () => {
    const fm = runReadingTime([], { author: 'test' });
    expect(fm.author).toBe('test');
    expect(fm.readingTime).toBe(1);
  });
});
