import { describe, expect, it } from 'vitest';
import { createDiagnostics } from '../../diagnostics.js';
import { markdownComponentRegistry } from '../../registry.js';
import { linksPass } from './links.js';

/**
 * @param {import('./links.js').MarkdownNode[]} children
 */
function root(children) {
  return { type: 'root', children };
}

/**
 * @param {string} url
 * @param {number} [line]
 * @param {number} [column]
 */
function linkNode(url, line = 1, column = 1) {
  return {
    type: 'link',
    url,
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

/**
 * @param {Set<string>} knownSlugs
 * @returns {(tree: import('./links.js').MarkdownNode, file: { path?: string }) => void}
 */
function getRemarkPlugin(knownSlugs) {
  const ctx = createContext();
  ctx.state.knownSlugs = knownSlugs;
  const plugins = /** @type {any} */ (linksPass({ knownSlugs }).mdsvex)(ctx).remarkPlugins;
  const plugin = /** @type {any} */ (plugins?.[0]);
  if (typeof plugin !== 'function') {
    throw new Error('Expected remark plugin to be a function');
  }
  const transformer = /** @type {any} */ (plugin.call(/** @type {any} */ (null)));
  return transformer;
}

describe('links pass', () => {
  it('allows known internal blog links', () => {
    const file = { path: 'post.md' };
    getRemarkPlugin(new Set(['existing-post']))(root([linkNode('/blog/existing-post')]), file);
    // No assertions needed — test passes if no exception is thrown.
  });

  it('reports broken internal blog links', () => {
    const ctx = createContext();
    ctx.state.knownSlugs = new Set(['existing-post']);
    const plugins = /** @type {any} */ (
      linksPass({ knownSlugs: new Set(['existing-post']) }).mdsvex
    )(ctx).remarkPlugins;
    const plugin = /** @type {any} */ (plugins?.[0]);
    if (typeof plugin !== 'function') throw new Error('Expected remark plugin to be a function');
    const transformer = /** @type {any} */ (plugin.call(/** @type {any} */ (null)));

    transformer(root([linkNode('/blog/missing-post', 3, 5)]), { path: 'post.md' });

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX011_BROKEN_INTERNAL_LINK',
        message: expect.stringContaining('/blog/missing-post'),
        file: 'post.md',
        line: 3,
        column: 5,
      }),
    ]);
  });

  it('reports empty anchor links', () => {
    const ctx = createContext();
    const plugins = /** @type {any} */ (linksPass({ knownSlugs: new Set() }).mdsvex)(
      ctx
    ).remarkPlugins;
    const plugin = /** @type {any} */ (plugins?.[0]);
    if (typeof plugin !== 'function') throw new Error('Expected remark plugin to be a function');
    const transformer = /** @type {any} */ (plugin.call(/** @type {any} */ (null)));

    transformer(root([linkNode('#', 2, 1)]), { path: 'post.md' });

    expect(ctx.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX012_EMPTY_ANCHOR',
        message: expect.stringContaining('Empty anchor'),
      }),
    ]);
  });

  it('ignores external links', () => {
    const ctx = createContext();
    ctx.state.knownSlugs = new Set();
    const plugins = /** @type {any} */ (linksPass({ knownSlugs: new Set() }).mdsvex)(
      ctx
    ).remarkPlugins;
    const plugin = /** @type {any} */ (plugins?.[0]);
    if (typeof plugin !== 'function') throw new Error('Expected remark plugin to be a function');
    const transformer = /** @type {any} */ (plugin.call(/** @type {any} */ (null)));

    transformer(root([linkNode('https://example.com')]), { path: 'post.md' });

    expect(ctx.diagnostics.list()).toEqual([]);
  });

  it('ignores relative page links', () => {
    const ctx = createContext();
    ctx.state.knownSlugs = new Set();
    const plugins = /** @type {any} */ (linksPass({ knownSlugs: new Set() }).mdsvex)(
      ctx
    ).remarkPlugins;
    const plugin = /** @type {any} */ (plugins?.[0]);
    if (typeof plugin !== 'function') throw new Error('Expected remark plugin to be a function');
    const transformer = /** @type {any} */ (plugin.call(/** @type {any} */ (null)));

    transformer(root([linkNode('/about'), linkNode('/rss.xml')]), { path: 'post.md' });

    expect(ctx.diagnostics.list()).toEqual([]);
  });
});
