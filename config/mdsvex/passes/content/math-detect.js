/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} value
 * @property {string=} lang
 * @property {string=} url
 * @property {MarkdownNode[]=} children
 */

export function mathDetectPass() {
  return {
    name: 'math-detect',
    phase: /** @type {const} */ ('remark'),
    mdsvex() {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createMathDetectRemarkPlugin(),
        ]),
      };
    },
  };
}

/**
 * @returns {(tree: MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function createMathDetectRemarkPlugin() {
  return function mathDetectAttacher() {
    /**
     * @param {MarkdownNode} tree
     * @param {{ data?: Record<string, unknown> }} file
     */
    return function mathDetectTransformer(tree, file) {
      if (hasMathBlock(tree)) {
        file.data ??= {};
        file.data.fm ??= {};
        /** @type {Record<string, unknown>} */ (file.data.fm).hasMath = true;
      }
    };
  };
}

/**
 * @param {MarkdownNode} node
 */
function hasMathBlock(node) {
  if (
    node.type === 'html' &&
    typeof node.value === 'string' &&
    /<MathCopy[\s/>]/.test(node.value)
  ) {
    return true;
  }
  return node.children?.some(hasMathBlock) ?? false;
}
