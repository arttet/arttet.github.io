import { describe, expect, it } from 'vitest';
import { DIAGNOSTIC_CODES } from '../../constants.js';
import { createBuildContext } from '../../engine/context.js';
import { imagesGuardPass } from './images.js';

/**
 * @param {import('./images.js').MarkdownNode[]} children
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
 * @param {import('../../engine/context.js').MarkdownMode} [mode]
 * @returns {import('../../engine/context.js').BuildContext}
 */
function createTestContext(mode = 'warn') {
  return createBuildContext(mode);
}

describe('images guard pass', () => {
  it('allows images with alt text', () => {
    const ctx = createTestContext();
    const plugins = /** @type {any} */ (imagesGuardPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    plugin.call(/** @type {any} */ (null))(root([imageNode('/img.png', 'Description')]), {
      path: 'post.md',
    });
    expect(ctx.diagnostics.list()).toEqual([]);
  });

  it('reports images missing alt text', () => {
    const ctx = createTestContext();
    const plugins = /** @type {any} */ (imagesGuardPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    plugin.call(/** @type {any} */ (null))(root([imageNode('/img.png', ''), imageNode('/x.jpg')]), {
      path: 'post.md',
    });

    const diagnostics = ctx.diagnostics.list();
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics[0]).toMatchObject({
      code: DIAGNOSTIC_CODES.IMAGE_MISSING_ALT,
      file: 'post.md',
      severity: 'critical',
      pass: 'images',
    });
    expect(diagnostics[1]).toMatchObject({
      code: DIAGNOSTIC_CODES.IMAGE_MISSING_ALT,
      file: 'post.md',
      severity: 'critical',
      pass: 'images',
    });
  });

  it('ignores non-image nodes', () => {
    const ctx = createTestContext();
    const plugins = /** @type {any} */ (imagesGuardPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') {
      throw new Error('Expected remark plugin to be a function');
    }
    plugin.call(/** @type {any} */ (null))(root([{ type: 'text', value: 'hello' }]), {
      path: 'post.md',
    });
    expect(ctx.diagnostics.list()).toEqual([]);
  });
});
