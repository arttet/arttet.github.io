import { describe, expect, it } from 'vitest';
import { DIAGNOSTIC_CODES } from '../../constants.js';
import { createDiagnostics } from '../../engine/diagnostics.js';
import { markdownComponentRegistry } from '../../engine/registry.js';
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
 * @param {import('../../engine/index.js').MarkdownMode} [mode]
 * @returns {import('../../engine/index.js').MarkdownPipelineContext}
 */
function createContext(mode = 'warn') {
  return {
    mode,
    diagnostics: createDiagnostics(),
    registry: markdownComponentRegistry,
    state: {},
  };
}

describe('images guard pass', () => {
  it('allows images with alt text', () => {
    const ctx = createContext();
    const plugins = /** @type {any} */ (imagesGuardPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') throw new Error('Expected remark plugin to be a function');
    plugin.call(/** @type {any} */ (null))(root([imageNode('/img.png', 'Description')]), {
      path: 'post.md',
    });
    expect(ctx.diagnostics.list()).toEqual([]);
  });

  it('reports images missing alt text', () => {
    const ctx = createContext();
    const plugins = /** @type {any} */ (imagesGuardPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') throw new Error('Expected remark plugin to be a function');
    plugin.call(/** @type {any} */ (null))(root([imageNode('/img.png', ''), imageNode('/x.jpg')]), {
      path: 'post.md',
    });

    const diagnostics = ctx.diagnostics.list();
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics[0]).toMatchObject({
      code: DIAGNOSTIC_CODES.IMAGE_MISSING_ALT,
      file: 'post.md',
      severity: 'critical',
      step: 'images',
    });
    expect(diagnostics[1]).toMatchObject({
      code: DIAGNOSTIC_CODES.IMAGE_MISSING_ALT,
      file: 'post.md',
      severity: 'critical',
      step: 'images',
    });
  });

  it('ignores non-image nodes', () => {
    const ctx = createContext();
    const plugins = /** @type {any} */ (imagesGuardPass().mdsvex)(ctx).remarkPlugins;
    const plugin = plugins?.[0];
    if (typeof plugin !== 'function') throw new Error('Expected remark plugin to be a function');
    plugin.call(/** @type {any} */ (null))(root([{ type: 'text', value: 'hello' }]), {
      path: 'post.md',
    });
    expect(ctx.diagnostics.list()).toEqual([]);
  });
});
