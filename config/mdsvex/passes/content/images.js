import { DIAGNOSTIC_CODES, PASS_PHASES, SEVERITY, VALIDATION_MODE } from '../../constants.js';
import { resolvePassContext } from '../../engine/context.js';

import { walk } from '../_internal/walk.js';

/**
 * @typedef {import('../_internal/walk.js').MarkdownNode} MarkdownNode
 */

/**
 * @returns {import('../../engine/index.js').MarkdownPass}
 */
export function imagesGuardPass() {
  return {
    name: 'images-guard',
    phase: PASS_PHASES.VALIDATE,
    mdsvex(build) {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createImagesRemarkPlugin(build),
        ]),
      };
    },
  };
}

/**
 * @param {import('../../engine/context.js').BuildContext} build
 */
function createImagesRemarkPlugin(build) {
  return function imagesAttacher() {
    /**
     * @param {MarkdownNode} tree
     * @param {{ path?: string; history?: string[] }} file
     */
    return function imagesTransformer(tree, file) {
      const filePath = file.path ?? file.history?.[0];
      const ctx = resolvePassContext(build, filePath);
      walk(tree, (node) => {
        if (node.type === 'image' && (!node.alt || node.alt.trim().length === 0)) {
          addDiagnostic(ctx, {
            code: DIAGNOSTIC_CODES.IMAGE_MISSING_ALT,
            message: 'Image is missing alt text.',
            file: filePath,
          });
        }
      });
    };
  };
}

/**
 * @param {{ mode: import('../../engine/context.js').MarkdownMode; diagnostics: ReturnType<typeof import('../../engine/diagnostics.js').createDiagnostics> }} ctx
 * @param {{ code: string; message: string; file?: string }} diagnostic
 */
function addDiagnostic(ctx, diagnostic) {
  ctx.diagnostics.add({
    code: diagnostic.code,
    severity: SEVERITY.CRITICAL,
    pass: 'images',
    message:
      ctx.mode === VALIDATION_MODE.WARN
        ? `${diagnostic.message} This post would be skipped in strict mode.`
        : diagnostic.message,
    file: diagnostic.file,
  });
}
