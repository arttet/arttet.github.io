import { describe, expect, it } from 'vitest';
import { codeTabsDetectPass } from './code-tabs-detect.js';

/**
 * @param {import('./code-tabs-detect.js').MarkdownNode[]} children
 */
function root(children) {
  return { type: 'root', children };
}

/**
 * @param {string} value
 */
function htmlNode(value) {
  return { type: 'html', value };
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
function getHasCodeTabs(file) {
  return /** @type {Record<string, unknown> | undefined} */ (file.data?.fm)?.hasCodeTabs;
}

/**
 * @returns {(tree: import('./code-tabs-detect.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function getRemarkPlugin() {
  const plugins = codeTabsDetectPass().mdsvex().remarkPlugins;
  const plugin = plugins?.[0];
  if (typeof plugin !== 'function') {
    throw new Error('Expected remark plugin to be a function');
  }
  return /** @type {(tree: import('./code-tabs-detect.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void} */ (
    plugin.call(/** @type {any} */ (null))
  );
}

describe('code-tabs detect pass', () => {
  it('detects CodeTabs html nodes', () => {
    const file = createFile();
    getRemarkPlugin()(root([htmlNode('<CodeTabs title="test" />')]), file);
    expect(getHasCodeTabs(file)).toBe(true);
  });

  it('ignores non-code-tabs html nodes', () => {
    const file = createFile();
    getRemarkPlugin()(root([htmlNode('<div>plain</div>')]), file);
    expect(getHasCodeTabs(file)).toBeUndefined();
  });

  it('ignores plain text', () => {
    const file = createFile();
    getRemarkPlugin()(root([{ type: 'text', value: '<CodeTabs>' }]), file);
    expect(getHasCodeTabs(file)).toBeUndefined();
  });

  it('ignores similar component names', () => {
    const file = createFile();
    getRemarkPlugin()(root([htmlNode('<CodeTabsX />')]), file);
    expect(getHasCodeTabs(file)).toBeUndefined();
  });

  it('detects CodeTabs nested in other nodes', () => {
    const file = createFile();
    getRemarkPlugin()(root([{ type: 'paragraph', children: [htmlNode('<CodeTabs />')] }]), file);
    expect(getHasCodeTabs(file)).toBe(true);
  });

  it('does not leak state between files', () => {
    const transformer = getRemarkPlugin();
    const fileWithTabs = createFile();
    const fileWithoutTabs = createFile();

    transformer(root([htmlNode('<CodeTabs />')]), fileWithTabs);
    transformer(root([htmlNode('<div />')]), fileWithoutTabs);

    expect(getHasCodeTabs(fileWithTabs)).toBe(true);
    expect(getHasCodeTabs(fileWithoutTabs)).toBeUndefined();
  });
});
