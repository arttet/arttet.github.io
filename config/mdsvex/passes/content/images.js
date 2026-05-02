/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} alt
 * @property {string=} value
 * @property {MarkdownNode[]=} children
 */

/**
 * @returns {import('../../engine.js').MarkdownPass}
 */
export function imagesGuardPass() {
  return {
    name: 'images-guard',
    phase: /** @type {const} */ ('validate'),
    mdsvex(ctx) {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createImagesRemarkPlugin(ctx),
        ]),
      };
    },
  };
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 */
function createImagesRemarkPlugin(ctx) {
  return function imagesAttacher() {
    /**
     * @param {MarkdownNode} tree
     * @param {{ path?: string; history?: string[] }} file
     */
    return function imagesTransformer(tree, file) {
      const filePath = file.path ?? file.history?.[0];
      walk(tree, (node) => {
        if (node.type === 'image' && (!node.alt || node.alt.trim().length === 0)) {
          addDiagnostic(ctx, {
            code: 'MDX004_IMAGE_MISSING_ALT',
            message: 'Image is missing alt text.',
            file: filePath,
          });
        }
      });
    };
  };
}

/**
 * @param {MarkdownNode} node
 * @param {(node: MarkdownNode) => void} visit
 */
function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) {
    walk(child, visit);
  }
}

/**
 * @param {import('../../engine.js').MarkdownPipelineContext} ctx
 * @param {{ code: string; message: string; file?: string }} diagnostic
 */
function addDiagnostic(ctx, diagnostic) {
  ctx.diagnostics.add({
    code: diagnostic.code,
    severity: 'critical',
    step: 'images',
    message:
      ctx.mode === 'warn'
        ? `${diagnostic.message} This post would be skipped in strict mode.`
        : diagnostic.message,
    file: diagnostic.file,
  });
}
