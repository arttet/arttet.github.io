/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {number=} depth
 * @property {string=} lang
 * @property {string=} url
 * @property {string=} value
 * @property {MarkdownNode[]=} children
 */

export function extractionPass() {
  return {
    name: 'extraction',
    phase: /** @type {const} */ ('extract'),
    mdsvex() {
      return {
        remarkPlugins: /** @type {import('mdsvex').MdsvexOptions['remarkPlugins']} */ ([
          createExtractionRemarkPlugin(),
        ]),
      };
    },
  };
}

/**
 * @returns {(tree: MarkdownNode, file: { data?: Record<string, unknown> }) => void}
 */
function createExtractionRemarkPlugin() {
  return function extractionAttacher() {
    /**
     * @param {MarkdownNode} tree
     * @param {{ data?: Record<string, unknown> }} file
     */
    return function extractionTransformer(tree, file) {
      const extracted = extractFromTree(tree);
      if (Object.keys(extracted).length > 0) {
        file.data ??= {};
        file.data.fm ??= {};
        /** @type {Record<string, unknown>} */ (file.data.fm).extracted = extracted;
      }
    };
  };
}

/**
 * @param {MarkdownNode} tree
 * @returns {Record<string, unknown>}
 */
function extractFromTree(tree) {
  /** @type {string[]} */
  const headings = [];
  /** @type {string[]} */
  const codeLangs = [];
  /** @type {string[]} */
  const images = [];
  /** @type {string[]} */
  const links = [];
  let hasMath = false;
  let hasMermaid = false;

  walk(tree, (node) => {
    if (node.type === 'heading') {
      const text = extractText(node);
      if (text) {
        headings.push(text);
      }
    }
    if (node.type === 'code' && node.lang) {
      codeLangs.push(node.lang);
      if (node.lang === 'mermaid') {
        hasMermaid = true;
      }
    }
    if (node.type === 'image' && node.url) {
      images.push(node.url);
    }
    if (node.type === 'link' && node.url) {
      links.push(node.url);
    }
    if (
      node.type === 'html' &&
      typeof node.value === 'string' &&
      /<MathCopy[\s/>]/.test(node.value)
    ) {
      hasMath = true;
    }
  });

  /** @type {Record<string, unknown>} */
  const result = {};
  if (headings.length > 0) {
    result.headings = headings;
  }
  if (codeLangs.length > 0) {
    result.codeLangs = codeLangs;
  }
  if (images.length > 0) {
    result.images = images;
  }
  if (links.length > 0) {
    result.links = links;
  }
  if (hasMath) {
    result.hasMath = true;
  }
  if (hasMermaid) {
    result.hasMermaid = true;
  }
  return result;
}

/**
 * @param {MarkdownNode} node
 * @returns {string}
 */
function extractText(node) {
  if (node.type === 'text' && typeof node.value === 'string') {
    return node.value;
  }
  return node.children?.map(extractText).join('') ?? '';
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
