/**
 * @typedef {Object} HastNode
 * @property {string} type
 * @property {string=} tagName
 * @property {Record<string, unknown>=} properties
 * @property {HastNode[]=} children
 */

export function imagesPass() {
  return {
    name: 'images',
    phase: /** @type {const} */ ('rehype'),
    mdsvex() {
      return {
        rehypePlugins: /** @type {import('mdsvex').MdsvexOptions['rehypePlugins']} */ ([
          createImagesRehypePlugin,
        ]),
      };
    },
  };
}

/**
 * @returns {(tree: HastNode) => void}
 */
function createImagesRehypePlugin() {
  return function imagesTransformer(tree) {
    walk(tree, (node) => {
      if (node.type === 'element' && node.tagName === 'img') {
        /** @type {Record<string, unknown>} */
        const props = node.properties ?? {};
        props.loading = 'lazy';
        props.decoding = 'async';
        node.properties = props;
      }
    });
  };
}

/**
 * @param {HastNode} node
 * @param {(node: HastNode) => void} visit
 */
function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) {
    walk(child, visit);
  }
}
