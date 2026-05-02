/**
 * @typedef {Object} HastNode
 * @property {string} type
 * @property {string=} tagName
 * @property {Record<string, unknown>=} properties
 * @property {HastNode[]=} children
 * @property {string=} value
 */

export function tocPass() {
  return {
    name: 'toc',
    phase: /** @type {const} */ ('rehype'),
    mdsvex() {
      return {
        rehypePlugins: /** @type {import('mdsvex').MdsvexOptions['rehypePlugins']} */ ([
          createTocRehypePlugin(),
        ]),
      };
    },
  };
}

/**
 * @returns {(tree: HastNode, file: { data?: Record<string, unknown> }) => void}
 */
function createTocRehypePlugin() {
  return function tocAttacher() {
    /**
     * @param {HastNode} tree
     * @param {{ data?: Record<string, unknown> }} file
     */
    return function tocTransformer(tree, file) {
      const headings = collectTocHeadings(tree);
      if (headings.length > 0) {
        file.data ??= {};
        file.data.fm ??= {};
        /** @type {Record<string, unknown>} */ (file.data.fm).tocHeadings = headings;
      }
    };
  };
}

/**
 * @param {HastNode} node
 * @param {{ depth: number; text: string; id: string }[]} [acc]
 * @returns {{ depth: number; text: string; id: string }[]}
 */
function collectTocHeadings(node, acc = []) {
  if (node.type === 'element' && /^h[1-6]$/.test(node.tagName ?? '')) {
    const depth = Number(node.tagName?.[1]);
    const id = /** @type {string | undefined} */ (node.properties?.id) ?? '';
    const text = extractText(node);
    acc.push({ depth, text, id });
  }
  for (const child of node.children ?? []) {
    collectTocHeadings(child, acc);
  }
  return acc;
}

/**
 * @param {HastNode} node
 * @returns {string}
 */
function extractText(node) {
  if (node.type === 'text' && typeof node.value === 'string') {
    return node.value;
  }
  return node.children?.map(extractText).join('') ?? '';
}
