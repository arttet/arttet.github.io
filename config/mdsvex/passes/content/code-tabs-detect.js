/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} value
 * @property {string=} lang
 * @property {string=} url
 * @property {MarkdownNode[]=} children
 */

export function codeTabsDetectPass() {
  return {
    name: 'code-tabs-detect',
    phase: /** @type {const} */ ('remark'),
    mdsvex() {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createCodeTabsDetectRemarkPlugin(),
        ]),
      };
    },
  };
}

/**
 * @returns {(tree: MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function createCodeTabsDetectRemarkPlugin() {
  return function codeTabsDetectAttacher() {
    /**
     * @param {MarkdownNode} tree
     * @param {{ data?: Record<string, unknown> }} file
     */
    return function codeTabsDetectTransformer(tree, file) {
      if (hasCodeTabsBlock(tree)) {
        file.data ??= {};
        file.data.fm ??= {};
        /** @type {Record<string, unknown>} */ (file.data.fm).hasCodeTabs = true;
      }
    };
  };
}

/**
 * @param {MarkdownNode} node
 */
function hasCodeTabsBlock(node) {
  if (
    node.type === 'html' &&
    typeof node.value === 'string' &&
    /<CodeTabs[\s/>]/.test(node.value)
  ) {
    return true;
  }
  return node.children?.some(hasCodeTabsBlock) ?? false;
}
