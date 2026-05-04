import { describe, expect, it } from 'vitest';
import { createBuildContext } from '../../engine/context.js';
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
 * @param {string} [text]
 */
function headingNode(depth, line = 1, column = 1, text = `Heading ${depth}`) {
  return {
    type: 'heading',
    depth,
    children: [{ type: 'text', value: text }],
    position: { start: { line, column } },
  };
}

/**
 * @param {import('../../engine/context.js').MarkdownMode} [mode]
 * @returns {import('../../engine/context.js').BuildContext}
 */
function createTestContext(mode = 'warn') {
  return createBuildContext(mode);
}

describe('headings pass', () => {
  it('allows valid heading hierarchy', () => {
    const ctx = createTestContext();
    const plugins = /** @type {any} */ (headingsPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    plugin.call(/** @type {any} */ (null))(root([headingNode(1), headingNode(2), headingNode(3)]), {
      path: 'post.md',
    });
    expect(ctx.diagnostics.list()).toEqual([]);
  });

  it('reports multiple h1 headings', () => {
    const ctx = createTestContext();
    const plugins = /** @type {any} */ (headingsPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    plugin.call(/** @type {any} */ (null))(
      root([headingNode(1, 1), headingNode(1, 5, 1, 'Another H1')]),
      {
        path: 'post.md',
      }
    );

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX014_MULTIPLE_H1',
        message: expect.stringContaining('Multiple h1'),
        line: 5,
      }),
    ]);
  });

  it('reports heading hierarchy skip', () => {
    const ctx = createTestContext();
    const plugins = /** @type {any} */ (headingsPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
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
    const ctx = createTestContext();
    const plugins = /** @type {any} */ (headingsPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    plugin.call(/** @type {any} */ (null))(
      root([headingNode(2, 1, 1, 'A'), headingNode(2, 2, 1, 'B'), headingNode(2, 3, 1, 'C')]),
      {
        path: 'post.md',
      }
    );
    expect(ctx.diagnostics.list()).toEqual([]);
  });

  it('reports duplicate heading text', () => {
    const ctx = createTestContext();
    const plugins = /** @type {any} */ (headingsPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    plugin.call(/** @type {any} */ (null))(
      root([headingNode(2, 1, 1, 'Same'), headingNode(3, 5, 1, 'Same')]),
      {
        path: 'post.md',
      }
    );

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX008_DUPLICATE_HEADING',
        message: expect.stringContaining('Same'),
        line: 5,
      }),
    ]);
  });
});
