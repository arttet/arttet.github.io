import { describe, expect, it } from 'vitest';
import { createDiagnostics } from '../../diagnostics.js';
import { markdownComponentRegistry } from '../../registry.js';
import { headingsPass } from './headings.js';

/**
 * @param {import('./headings.js').MarkdownNode[]} children
 */
function root(children) {
  return { type: 'root', children };
}

/**
 * @param {number} depth
 * @param {number} [line]
 * @param {number} [column]
 */
function headingNode(depth, line = 1, column = 1) {
  return {
    type: 'heading',
    depth,
    children: [{ type: 'text', value: `Heading ${depth}` }],
    position: { start: { line, column } },
  };
}

/**
 * @param {import('../../engine.js').MarkdownMode} [mode]
 * @returns {import('../../engine.js').MarkdownPipelineContext}
 */
function createContext(mode = 'warn') {
  return {
    mode,
    diagnostics: createDiagnostics(),
    registry: markdownComponentRegistry,
    state: {},
  };
}

describe('headings pass', () => {
  it('allows valid heading hierarchy', () => {
    const ctx = createContext();
    const plugins = /** @type {any} */ (headingsPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') throw new Error('Expected remark plugin to be a function');
    plugin.call(/** @type {any} */ (null))(root([headingNode(1), headingNode(2), headingNode(3)]), {
      path: 'post.md',
    });
    expect(ctx.diagnostics.list()).toEqual([]);
  });

  it('reports multiple h1 headings', () => {
    const ctx = createContext();
    const plugins = /** @type {any} */ (headingsPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') throw new Error('Expected remark plugin to be a function');
    plugin.call(/** @type {any} */ (null))(root([headingNode(1, 1), headingNode(1, 5)]), {
      path: 'post.md',
    });

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX014_MULTIPLE_H1',
        message: expect.stringContaining('Multiple h1'),
        line: 5,
      }),
    ]);
  });

  it('reports heading hierarchy skip', () => {
    const ctx = createContext();
    const plugins = /** @type {any} */ (headingsPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') throw new Error('Expected remark plugin to be a function');
    plugin.call(/** @type {any} */ (null))(root([headingNode(1), headingNode(3)]), {
      path: 'post.md',
    });

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX015_HEADING_HIERARCHY_SKIP',
        message: expect.stringContaining('h1 → h3'),
        line: 1,
      }),
    ]);
  });

  it('allows same-level headings', () => {
    const ctx = createContext();
    const plugins = /** @type {any} */ (headingsPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') throw new Error('Expected remark plugin to be a function');
    plugin.call(/** @type {any} */ (null))(root([headingNode(2), headingNode(2), headingNode(2)]), {
      path: 'post.md',
    });
    expect(ctx.diagnostics.list()).toEqual([]);
  });
});
