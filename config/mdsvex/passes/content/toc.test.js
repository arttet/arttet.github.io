import { describe, expect, it } from 'vitest';
import { tocPass } from './toc.js';

/**
 * @param {import('./toc.js').HastNode[]} children
 */
function root(children) {
  return { type: 'root', children };
}

/**
 * @param {string} tag
 * @param {string} id
 * @param {import('./toc.js').HastNode[]} children
 */
function headingElement(tag, id, children) {
  return {
    type: 'element',
    tagName: tag,
    properties: { id },
    children,
  };
}

/**
 * @param {string} value
 */
function textNode(value) {
  return { type: 'text', value };
}

/**
 * @returns {(tree: import('./toc.js').HastNode, file: { data?: { fm?: Record<string, unknown> } }) => void}
 */
function getRehypePlugin() {
  const plugins = tocPass().mdsvex().rehypePlugins;
  const plugin = plugins?.[0];
  if (typeof plugin !== 'function') {
    throw new Error('Expected rehype plugin to be a function');
  }
  return /** @type {(tree: import('./toc.js').HastNode, file: { data?: Record<string, unknown> }) => void} */ (
    plugin.call(/** @type {any} */ (null))
  );
}

describe('toc pass', () => {
  it('collects headings with depth, text, and id', () => {
    const file = { data: {} };
    getRehypePlugin()(
      root([
        headingElement('h1', 'intro', [textNode('Introduction')]),
        headingElement('h2', 'setup', [textNode('Setup')]),
        headingElement('h3', 'config', [textNode('Configuration')]),
      ]),
      file
    );

    expect(/** @type {any} */ (file.data)?.fm?.tocHeadings).toEqual([
      { depth: 1, text: 'Introduction', id: 'intro' },
      { depth: 2, text: 'Setup', id: 'setup' },
      { depth: 3, text: 'Configuration', id: 'config' },
    ]);
  });

  it('extracts nested text', () => {
    const file = { data: {} };
    getRehypePlugin()(
      root([
        headingElement('h2', 'code', [
          { type: 'element', tagName: 'code', properties: {}, children: [textNode('inline')] },
          textNode(' code'),
        ]),
      ]),
      file
    );

    expect(/** @type {any} */ (file.data)?.fm?.tocHeadings).toEqual([
      { depth: 2, text: 'inline code', id: 'code' },
    ]);
  });

  it('ignores non-heading elements', () => {
    const file = { data: {} };
    getRehypePlugin()(
      root([{ type: 'element', tagName: 'p', properties: {}, children: [textNode('paragraph')] }]),
      file
    );

    expect(/** @type {any} */ (file.data)?.fm?.tocHeadings).toBeUndefined();
  });

  it('does not leak state between files', () => {
    const transformer = getRehypePlugin();
    const fileA = { data: {} };
    const fileB = { data: {} };

    transformer(root([headingElement('h1', 'a', [textNode('A')])]), fileA);
    transformer(root([]), fileB);

    expect(/** @type {any} */ (fileA.data)?.fm?.tocHeadings).toEqual([
      { depth: 1, text: 'A', id: 'a' },
    ]);
    expect(/** @type {any} */ (fileB.data)?.fm?.tocHeadings).toBeUndefined();
  });
});
