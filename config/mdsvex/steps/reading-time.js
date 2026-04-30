/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} value
 * @property {MarkdownNode[]=} children
 */

export function readingTimeStep() {
  return {
    name: 'reading-time',
    phase: /** @type {const} */ ('remark'),
    mdsvex() {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          remarkReadingTime,
        ]),
      };
    },
  };
}

function remarkReadingTime() {
  /**
   * @param {MarkdownNode} tree
   * @param {{ data: { fm?: Record<string, unknown> } }} file
   */
  return (tree, file) => {
    let text = '';

    /**
     * @param {MarkdownNode} node
     */
    function walk(node) {
      if (node.type === 'text' || node.type === 'inlineCode') {
        text += `${node.value} `;
      }

      node.children?.forEach(walk);
    }

    walk(tree);

    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const readingTime = Math.max(1, Math.round(words / 200));

    file.data.fm ??= {};
    file.data.fm.readingTime = readingTime;
  };
}
