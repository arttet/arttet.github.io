import {
  DIAGNOSTIC_CODES,
  PASS_PHASES,
  RESOURCE_LIMITS,
  SEVERITY,
  VALIDATION_MODE,
} from '../../constants.js';
import { resolvePassContext } from '../../engine/context.js';
import { walk } from '../_internal/walk.js';

/**
 * @typedef {import('../_internal/walk.js').MarkdownNode} MarkdownNode
 */

export function resourceLimitsPass() {
  return {
    name: 'resource-limits',
    phase: PASS_PHASES.VALIDATE,
    /**
     * @param {import('../../engine/context.js').BuildContext} build
     */
    mdsvex(build) {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createResourceLimitsRemarkPlugin(build),
        ]),
      };
    },
  };
}

/**
 * @param {import('../../engine/context.js').BuildContext} build
 */
function createResourceLimitsRemarkPlugin(build) {
  return function resourceLimitsAttacher() {
    /**
     * @param {MarkdownNode} tree
     * @param {{ path?: string; history?: string[] }} file
     */
    return function resourceLimitsTransformer(tree, file) {
      const filePath = file.path ?? file.history?.[0];
      const ctx = resolvePassContext(build, filePath);

      const nodeCount = countNodes(tree);
      if (nodeCount > RESOURCE_LIMITS.MAX_AST_NODES) {
        addDiagnostic(ctx, {
          code: DIAGNOSTIC_CODES.RESOURCE_AST_NODES,
          message: `AST node count (${nodeCount}) exceeds limit of ${RESOURCE_LIMITS.MAX_AST_NODES}.`,
          file: filePath,
        });
      }

      const imageCount = countImages(tree);
      if (imageCount > RESOURCE_LIMITS.MAX_IMAGES) {
        addDiagnostic(ctx, {
          code: DIAGNOSTIC_CODES.RESOURCE_IMAGE_COUNT,
          message: `Image count (${imageCount}) exceeds limit of ${RESOURCE_LIMITS.MAX_IMAGES}.`,
          file: filePath,
        });
      }

      const maxHeadingDepth = findMaxHeadingDepth(tree);
      if (maxHeadingDepth > RESOURCE_LIMITS.MAX_HEADING_DEPTH) {
        addDiagnostic(ctx, {
          code: DIAGNOSTIC_CODES.RESOURCE_HEADING_DEPTH,
          message: `Heading depth (${maxHeadingDepth}) exceeds limit of h${RESOURCE_LIMITS.MAX_HEADING_DEPTH}.`,
          file: filePath,
        });
      }
    };
  };
}

/**
 * @param {MarkdownNode} node
 * @returns {number}
 */
function countNodes(node) {
  let count = 1;
  for (const child of node.children ?? []) {
    count += countNodes(child);
  }
  return count;
}

/**
 * @param {MarkdownNode} node
 * @returns {number}
 */
function countImages(node) {
  let count = 0;
  walk(node, (n) => {
    if (n.type === 'image') {
      count += 1;
    }
  });
  return count;
}

/**
 * @param {MarkdownNode} node
 * @returns {number}
 */
function findMaxHeadingDepth(node) {
  let maxDepth = 0;
  walk(node, (n) => {
    if (n.type === 'heading' && typeof n.depth === 'number' && n.depth > maxDepth) {
      maxDepth = n.depth;
    }
  });
  return maxDepth;
}

/**
 * @param {{ mode: import('../../engine/context.js').MarkdownMode; diagnostics: ReturnType<typeof import('../../engine/diagnostics.js').createDiagnostics> }} ctx
 * @param {{ code: string; message: string; file?: string }} diagnostic
 */
function addDiagnostic(ctx, diagnostic) {
  ctx.diagnostics.add({
    code: diagnostic.code,
    severity: ctx.mode === VALIDATION_MODE.STRICT ? SEVERITY.CRITICAL : SEVERITY.WARNING,
    pass: 'resource-limits',
    message:
      ctx.mode === VALIDATION_MODE.WARN
        ? `${diagnostic.message} This post would be skipped in strict mode.`
        : diagnostic.message,
    file: diagnostic.file,
  });
}
