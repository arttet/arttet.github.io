import { describe, expect, it } from 'vitest';
import { createBuildContext, stateWrite } from '../../engine/context.js';
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
 * @param {import('../../engine/context.js').MarkdownMode} [mode]
 * @returns {import('../../engine/context.js').BuildContext}
 */
function createTestContext(mode = 'warn') {
  return createBuildContext(mode);
}

/**
 * @param {Set<string>} knownSlugs
 * @param {Set<string>} [draftSlugs]
 * @returns {(tree: import('./links.js').MarkdownNode, file: { path?: string }) => void}
 */
function getRemarkPlugin(knownSlugs, draftSlugs = new Set()) {
  const build = createTestContext();
  stateWrite(build.state, 'knownSlugs', knownSlugs);
  stateWrite(build.state, 'draftSlugs', draftSlugs);
  const plugins = /** @type {any} */ (linksPass({ knownSlugs }).mdsvex)(build).remarkPlugins;
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
    const build = createTestContext();
    stateWrite(build.state, 'knownSlugs', new Set(['existing-post']));
    const plugins = /** @type {any} */ (
      linksPass({ knownSlugs: new Set(['existing-post']) }).mdsvex
    )(build).remarkPlugins;
    const plugin = /** @type {any} */ (plugins?.[0]);
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    const transformer = /** @type {any} */ (plugin.call(/** @type {any} */ (null)));

    transformer(root([linkNode('/blog/missing-post', 3, 5)]), { path: 'post.md' });

    expect(build.diagnostics.list()).toEqual([
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
    const build = createTestContext();
    const plugins = /** @type {any} */ (linksPass({ knownSlugs: new Set() }).mdsvex)(
      build
    ).remarkPlugins;
    const plugin = /** @type {any} */ (plugins?.[0]);
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    const transformer = /** @type {any} */ (plugin.call(/** @type {any} */ (null)));

    transformer(root([linkNode('#', 2, 1)]), { path: 'post.md' });

    expect(build.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX012_EMPTY_ANCHOR',
        message: expect.stringContaining('Empty anchor'),
      }),
    ]);
  });

  it('ignores external links', () => {
    const build = createTestContext();
    stateWrite(build.state, 'knownSlugs', new Set());
    const plugins = /** @type {any} */ (linksPass({ knownSlugs: new Set() }).mdsvex)(
      build
    ).remarkPlugins;
    const plugin = /** @type {any} */ (plugins?.[0]);
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    const transformer = /** @type {any} */ (plugin.call(/** @type {any} */ (null)));

    transformer(root([linkNode('https://example.com')]), { path: 'post.md' });

    expect(build.diagnostics.list()).toEqual([]);
  });

  it('ignores relative page links', () => {
    const build = createTestContext();
    stateWrite(build.state, 'knownSlugs', new Set());
    const plugins = /** @type {any} */ (linksPass({ knownSlugs: new Set() }).mdsvex)(
      build
    ).remarkPlugins;
    const plugin = /** @type {any} */ (plugins?.[0]);
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    const transformer = /** @type {any} */ (plugin.call(/** @type {any} */ (null)));

    transformer(root([linkNode('/about'), linkNode('/rss.xml')]), { path: 'post.md' });

    expect(build.diagnostics.list()).toEqual([]);
  });

  it('reports links to draft posts', () => {
    const build = createTestContext();
    stateWrite(build.state, 'knownSlugs', new Set(['draft-post']));
    stateWrite(build.state, 'draftSlugs', new Set(['draft-post']));
    const plugins = /** @type {any} */ (linksPass({ knownSlugs: new Set(['draft-post']) }).mdsvex)(
      build
    ).remarkPlugins;
    const plugin = /** @type {any} */ (plugins?.[0]);
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    const transformer = /** @type {any} */ (plugin.call(/** @type {any} */ (null)));

    transformer(root([linkNode('/blog/draft-post', 4, 2)]), { path: 'post.md' });

    expect(build.diagnostics.list()).toEqual([
      expect.objectContaining({
        code: 'MDX009_LINK_TO_HIDDEN',
        message: expect.stringContaining('draft-post'),
        file: 'post.md',
        line: 4,
        column: 2,
      }),
    ]);
  });
});
