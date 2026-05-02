import { describe, expect, it } from 'vitest';
import { mathDetectPass } from './math-detect.js';

/**
 * @param {import('./math-detect.js').MarkdownNode[]} children
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
function getHasMath(file) {
  return /** @type {Record<string, unknown> | undefined} */ (file.data?.fm)?.hasMath;
}

/**
 * @returns {(tree: import('./math-detect.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function getRemarkPlugin() {
  const plugins = mathDetectPass().mdsvex().remarkPlugins;
  const plugin = plugins?.[0];
  if (typeof plugin !== 'function') {
    throw new Error('Expected remark plugin to be a function');
  }
  return /** @type {(tree: import('./math-detect.js').MarkdownNode, file: { data?: Record<string, unknown> }) => void} */ (
    plugin.call(/** @type {any} */ (null))
  );
}

describe('math detect pass', () => {
  it('detects MathCopy html nodes', () => {
    const file = createFile();
    getRemarkPlugin()(root([htmlNode('<MathCopy display={true} />')]), file);
    expect(getHasMath(file)).toBe(true);
  });

  it('ignores non-math html nodes', () => {
    const file = createFile();
    getRemarkPlugin()(root([htmlNode('<div>plain</div>')]), file);
    expect(getHasMath(file)).toBeUndefined();
  });

  it('ignores plain text', () => {
    const file = createFile();
    getRemarkPlugin()(root([{ type: 'text', value: '<MathCopy>' }]), file);
    expect(getHasMath(file)).toBeUndefined();
  });

  it('ignores similar component names', () => {
    const file = createFile();
    getRemarkPlugin()(root([htmlNode('<MathCopyX />')]), file);
    expect(getHasMath(file)).toBeUndefined();
  });

  it('detects math nested in other nodes', () => {
    const file = createFile();
    getRemarkPlugin()(root([{ type: 'paragraph', children: [htmlNode('<MathCopy />')] }]), file);
    expect(getHasMath(file)).toBe(true);
  });

  it('does not leak state between files', () => {
    const transformer = getRemarkPlugin();
    const fileWithMath = createFile();
    const fileWithoutMath = createFile();

    transformer(root([htmlNode('<MathCopy />')]), fileWithMath);
    transformer(root([htmlNode('<div />')]), fileWithoutMath);

    expect(getHasMath(fileWithMath)).toBe(true);
    expect(getHasMath(fileWithoutMath)).toBeUndefined();
  });
});
