/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} lang
 * @property {string=} value
 * @property {MarkdownNode[]=} children
 */

export function mermaidStep() {
  return {
    name: 'mermaid',
    phase: /** @type {const} */ ('remark'),
    mdsvex() {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createMermaidRemarkPlugin(),
        ]),
      };
    },
  };
}

/**
 * @returns {(tree: MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function createMermaidRemarkPlugin() {
  return function mermaidAttacher() {
    /**
     * @param {MarkdownNode} tree
     * @param {{ data?: Record<string, unknown> }} file
     */
    return function mermaidTransformer(tree, file) {
      if (hasMermaidDiagram(tree)) {
        file.data ??= {};
        file.data.fm ??= {};
        /** @type {Record<string, unknown>} */ (file.data.fm).hasMermaid = true;
      }
    };
  };
}

/**
 * @param {MarkdownNode} node
 */
function hasMermaidDiagram(node) {
  if (node.type === 'code' && node.lang === 'mermaid') {
    return true;
  }
  return node.children?.some(hasMermaidDiagram) ?? false;
}
