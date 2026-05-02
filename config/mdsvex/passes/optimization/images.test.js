import { describe, expect, it } from 'vitest';
import { imagesPass } from './images.js';

/**
 * @param {import('./images.js').HastNode[]} children
 */
function root(children) {
  return { type: 'root', children };
}

/**
 * @param {string} src
 * @param {string} [alt]
 * @param {Record<string, unknown>} [props]
 */
function imgNode(src, alt = '', props = {}) {
  return {
    type: 'element',
    tagName: 'img',
    properties: { src, alt, ...props },
    children: [],
  };
}

/**
 * @returns {(tree: import('./images.js').HastNode) => void}
 */
function getRehypePlugin() {
  const plugins = imagesPass().mdsvex().rehypePlugins;
  const plugin = plugins?.[0];
  if (typeof plugin !== 'function') {
    throw new Error('Expected rehype plugin to be a function');
  }
  return /** @type {(tree: import('./images.js').HastNode) => void} */ (
    plugin.call(/** @type {any} */ (null))
  );
}

describe('images pass', () => {
  it('adds lazy loading attributes to img elements', () => {
    const node = imgNode('/test.png', 'test');
    getRehypePlugin()(root([node]));
    expect(node.properties).toEqual({
      src: '/test.png',
      alt: 'test',
      loading: 'lazy',
      decoding: 'async',
    });
  });

  it('preserves existing properties', () => {
    const node = imgNode('/x.png', 'x', { className: 'rounded' });
    getRehypePlugin()(root([node]));
    expect(node.properties).toEqual({
      src: '/x.png',
      alt: 'x',
      className: 'rounded',
      loading: 'lazy',
      decoding: 'async',
    });
  });

  it('ignores non-img elements', () => {
    const node = { type: 'element', tagName: 'div', properties: {}, children: [] };
    getRehypePlugin()(root([node]));
    expect(node.properties).toEqual({});
  });

  it('processes nested img elements', () => {
    const img = imgNode('/nested.png');
    const wrapper = { type: 'element', tagName: 'figure', properties: {}, children: [img] };
    getRehypePlugin()(root([wrapper]));
    expect(img.properties).toEqual({
      src: '/nested.png',
      alt: '',
      loading: 'lazy',
      decoding: 'async',
    });
  });
});
