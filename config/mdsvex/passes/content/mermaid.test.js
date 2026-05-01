import { describe, expect, it } from 'vitest';
import { mermaidPass } from './mermaid.js';

/**
 * @param {import('./mermaid.js').MarkdownNode[]} children
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
function getHasMermaid(file) {
  return /** @type {Record<string, unknown> | undefined} */ (file.data?.fm)?.hasMermaid;
}

/**
 * @returns {(tree: import('./mermaid.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function getRemarkPlugin() {
  const plugins = mermaidPass().mdsvex().remarkPlugins;
  const plugin = plugins?.[0];
  if (typeof plugin !== 'function') {
    throw new Error('Expected remark plugin to be a function');
  }
  return /** @type {(tree: import('./mermaid.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void} */ (
    plugin.call(/** @type {any} */ (null))
  );
}

describe('mermaid pass', () => {
  it('detects mermaid code blocks', () => {
    const file = createFile();
    getRemarkPlugin()(root([codeBlock('mermaid', 'graph TD; A-->B;')]), file);
    expect(getHasMermaid(file)).toBe(true);
  });

  it('ignores non-mermaid code blocks', () => {
    const file = createFile();
    getRemarkPlugin()(root([codeBlock('js', 'const x = 1;')]), file);
    expect(getHasMermaid(file)).toBeUndefined();
  });

  it('ignores inline code', () => {
    const file = createFile();
    getRemarkPlugin()(root([{ type: 'inlineCode', value: 'mermaid' }]), file);
    expect(getHasMermaid(file)).toBeUndefined();
  });

  it('detects mermaid nested in other nodes', () => {
    const file = createFile();
    getRemarkPlugin()(root([{ type: 'paragraph', children: [codeBlock('mermaid')] }]), file);
    expect(getHasMermaid(file)).toBe(true);
  });

  it('does not leak state between files', () => {
    const transformer = getRemarkPlugin();
    const fileWithMermaid = createFile();
    const fileWithoutMermaid = createFile();

    transformer(root([codeBlock('mermaid')]), fileWithMermaid);
    transformer(root([codeBlock('js')]), fileWithoutMermaid);

    expect(getHasMermaid(fileWithMermaid)).toBe(true);
    expect(getHasMermaid(fileWithoutMermaid)).toBeUndefined();
  });
});
