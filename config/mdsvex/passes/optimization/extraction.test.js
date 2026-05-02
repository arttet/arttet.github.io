import { describe, expect, it } from 'vitest';
import { extractionPass } from './extraction.js';

/**
 * @param {import('./extraction.js').MarkdownNode[]} children
 */
function root(children) {
  return { type: 'root', children };
}

/**
 * @param {number} depth
 * @param {import('./extraction.js').MarkdownNode[]} children
 */
function headingNode(depth, children) {
  return { type: 'heading', depth, children };
}

/**
 * @param {string} lang
 * @param {string} [value]
 */
function codeBlock(lang, value = '') {
  return { type: 'code', lang, value };
}

/**
 * @param {string} url
 * @param {string} [alt]
 */
function imageNode(url, alt = '') {
  return { type: 'image', url, alt };
}

/**
 * @param {string} url
 */
function linkNode(url) {
  return { type: 'link', url };
}

/**
 * @param {string} value
 */
function textNode(value) {
  return { type: 'text', value };
}

/**
 * @param {string} value
 */
function htmlNode(value) {
  return { type: 'html', value };
}

/**
 * @returns {(tree: import('./extraction.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function getRemarkPlugin() {
  const plugins = extractionPass().mdsvex().remarkPlugins;
  const plugin = plugins?.[0];
  if (typeof plugin !== 'function') {
    throw new Error('Expected remark plugin to be a function');
  }
  return /** @type {(tree: import('./extraction.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void} */ (
    plugin.call(/** @type {any} */ (null))
  );
}

/**
 * @param {{ data?: Record<string, unknown> }} file
 * @returns {Record<string, unknown> | undefined}
 */
function getExtracted(file) {
  const data = /** @type {{ fm?: { extracted?: Record<string, unknown> } } | undefined} */ (
    file.data
  );
  return data?.fm?.extracted;
}

describe('extraction pass', () => {
  it('extracts headings', () => {
    const file = { data: {} };
    getRemarkPlugin()(
      root([headingNode(1, [textNode('Intro')]), headingNode(2, [textNode('Setup')])]),
      file
    );
    expect(getExtracted(file)?.headings).toEqual(['Intro', 'Setup']);
  });

  it('extracts code languages', () => {
    const file = { data: {} };
    getRemarkPlugin()(root([codeBlock('js'), codeBlock('ts')]), file);
    expect(getExtracted(file)?.codeLangs).toEqual(['js', 'ts']);
  });

  it('extracts image urls', () => {
    const file = { data: {} };
    getRemarkPlugin()(root([imageNode('/img.png'), imageNode('/x.jpg')]), file);
    expect(getExtracted(file)?.images).toEqual(['/img.png', '/x.jpg']);
  });

  it('extracts link urls', () => {
    const file = { data: {} };
    getRemarkPlugin()(root([linkNode('/blog/post'), linkNode('https://example.com')]), file);
    expect(getExtracted(file)?.links).toEqual(['/blog/post', 'https://example.com']);
  });

  it('detects math from html', () => {
    const file = { data: {} };
    getRemarkPlugin()(root([htmlNode('<MathCopy />')]), file);
    expect(getExtracted(file)?.hasMath).toBe(true);
  });

  it('detects mermaid from code block', () => {
    const file = { data: {} };
    getRemarkPlugin()(root([codeBlock('mermaid')]), file);
    expect(getExtracted(file)?.hasMermaid).toBe(true);
  });

  it('does not leak state between files', () => {
    const transformer = getRemarkPlugin();
    const fileA = { data: {} };
    const fileB = { data: {} };
    transformer(root([headingNode(1, [textNode('A')])]), fileA);
    transformer(root([textNode('plain')]), fileB);
    expect(getExtracted(fileA)?.headings).toEqual(['A']);
    expect(getExtracted(fileB)).toBeUndefined();
  });
});
