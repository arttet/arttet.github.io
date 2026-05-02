import { describe, expect, it } from 'vitest';
import { codeDetectPass } from './code-detect.js';

/**
 * @param {import('./code-detect.js').MarkdownNode[]} children
 */
function root(children) {
  return { type: 'root', children };
}

/**
 * @param {string} lang
 * @param {string} [value]
 */
function codeBlock(lang, value = '') {
  return { type: 'code', lang, value };
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
function getHasCode(file) {
  return /** @type {Record<string, unknown> | undefined} */ (file.data?.fm)?.hasCode;
}

/**
 * @returns {(tree: import('./code-detect.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function getRemarkPlugin() {
  const plugins = codeDetectPass().mdsvex().remarkPlugins;
  const plugin = plugins?.[0];
  if (typeof plugin !== 'function') {
    throw new Error('Expected remark plugin to be a function');
  }
  return /** @type {(tree: import('./code-detect.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void} */ (
    plugin.call(/** @type {any} */ (null))
  );
}

describe('code detect pass', () => {
  it('detects code blocks', () => {
    const file = createFile();
    getRemarkPlugin()(root([codeBlock('js', 'const x = 1;')]), file);
    expect(getHasCode(file)).toBe(true);
  });

  it('ignores inline code', () => {
    const file = createFile();
    getRemarkPlugin()(root([{ type: 'inlineCode', value: 'code' }]), file);
    expect(getHasCode(file)).toBeUndefined();
  });

  it('ignores plain text', () => {
    const file = createFile();
    getRemarkPlugin()(root([{ type: 'text', value: 'code' }]), file);
    expect(getHasCode(file)).toBeUndefined();
  });

  it('detects code blocks nested in other nodes', () => {
    const file = createFile();
    getRemarkPlugin()(root([{ type: 'paragraph', children: [codeBlock('ts')] }]), file);
    expect(getHasCode(file)).toBe(true);
  });

  it('does not leak state between files', () => {
    const transformer = getRemarkPlugin();
    const fileWithCode = createFile();
    const fileWithoutCode = createFile();

    transformer(root([codeBlock('js')]), fileWithCode);
    transformer(root([{ type: 'text', value: 'hello' }]), fileWithoutCode);

    expect(getHasCode(fileWithCode)).toBe(true);
    expect(getHasCode(fileWithoutCode)).toBeUndefined();
  });
});
