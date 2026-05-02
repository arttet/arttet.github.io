/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} value
 * @property {string=} lang
 * @property {string=} url
 * @property {MarkdownNode[]=} children
 */

export function codeDetectPass() {
  return {
    name: 'code-detect',
    phase: /** @type {const} */ ('remark'),
    mdsvex() {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createCodeDetectRemarkPlugin(),
        ]),
      };
    },
  };
}

/**
 * @returns {(tree: MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function createCodeDetectRemarkPlugin() {
  return function codeDetectAttacher() {
    /**
     * @param {MarkdownNode} tree
     * @param {{ data?: Record<string, unknown> }} file
     */
    return function codeDetectTransformer(tree, file) {
      if (hasCodeBlock(tree)) {
        file.data ??= {};
        file.data.fm ??= {};
        /** @type {Record<string, unknown>} */ (file.data.fm).hasCode = true;
      }
    };
  };
}

/**
 * @param {MarkdownNode} node
 */
function hasCodeBlock(node) {
  if (node.type === 'code') {
    return true;
  }
  return node.children?.some(hasCodeBlock) ?? false;
}
