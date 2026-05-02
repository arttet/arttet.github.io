/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} value
 * @property {string=} lang
 * @property {string=} url
 * @property {MarkdownNode[]=} children
 */

export function imagesDetectPass() {
  return {
    name: 'images-detect',
    phase: /** @type {const} */ ('remark'),
    mdsvex() {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createImagesDetectRemarkPlugin(),
        ]),
      };
    },
  };
}

/**
 * @returns {(tree: MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function createImagesDetectRemarkPlugin() {
  return function imagesDetectAttacher() {
    /**
     * @param {MarkdownNode} tree
     * @param {{ data?: Record<string, unknown> }} file
     */
    return function imagesDetectTransformer(tree, file) {
      if (hasImage(tree)) {
        file.data ??= {};
        file.data.fm ??= {};
        /** @type {Record<string, unknown>} */ (file.data.fm).hasImages = true;
      }
    };
  };
}

/**
 * @param {MarkdownNode} node
 */
function hasImage(node) {
  if (node.type === 'image') {
    return true;
  }
  return node.children?.some(hasImage) ?? false;
}
