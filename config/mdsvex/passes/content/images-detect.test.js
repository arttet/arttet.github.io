import { describe, expect, it } from 'vitest';
import { imagesDetectPass } from './images-detect.js';

/**
 * @param {import('./images-detect.js').MarkdownNode[]} children
 */
function root(children) {
  return { type: 'root', children };
}

/**
 * @param {string} url
 * @param {string} [alt]
 */
function imageNode(url, alt = '') {
  return { type: 'image', url, alt };
}

/**
 * @returns {{ data?: Record<string, unknown> }}
 */
function createFile() {
  return { data: {} };
}

/**
 * @param {{ data?: Record<string, unknown> }} file
 * @returns {unknown}
 */
function getHasImages(file) {
  return /** @type {Record<string, unknown> | undefined} */ (file.data?.fm)?.hasImages;
}

/**
 * @returns {(tree: import('./images-detect.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function getRemarkPlugin() {
  const plugins = imagesDetectPass().mdsvex().remarkPlugins;
  const plugin = plugins?.[0];
  if (typeof plugin !== 'function') {
    throw new Error('Expected remark plugin to be a function');
  }
  return /** @type {(tree: import('./images-detect.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void} */ (
    plugin.call(/** @type {any} */ (null))
  );
}

describe('images detect pass', () => {
  it('detects image nodes', () => {
    const file = createFile();
    getRemarkPlugin()(root([imageNode('/img.png', 'alt')]), file);
    expect(getHasImages(file)).toBe(true);
  });

  it('ignores plain text', () => {
    const file = createFile();
    getRemarkPlugin()(root([{ type: 'text', value: 'image' }]), file);
    expect(getHasImages(file)).toBeUndefined();
  });

  it('detects images nested in other nodes', () => {
    const file = createFile();
    getRemarkPlugin()(root([{ type: 'paragraph', children: [imageNode('/a.png')] }]), file);
    expect(getHasImages(file)).toBe(true);
  });

  it('does not leak state between files', () => {
    const transformer = getRemarkPlugin();
    const fileWithImage = createFile();
    const fileWithoutImage = createFile();

    transformer(root([imageNode('/x.png')]), fileWithImage);
    transformer(root([{ type: 'text', value: 'hello' }]), fileWithoutImage);

    expect(getHasImages(fileWithImage)).toBe(true);
    expect(getHasImages(fileWithoutImage)).toBeUndefined();
  });
});
