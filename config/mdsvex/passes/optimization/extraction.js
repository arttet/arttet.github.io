import { walk } from '../_internal/walk.js';

/**
 * @typedef {import('../_internal/walk.js').MarkdownNode} MarkdownNode
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
        const fm = /** @type {Record<string, unknown>} */ (file.data.fm);
        fm.extracted = extracted;
        // Preserve backward compatibility: runtime metadata export reads fm directly.
        if (extracted.hasMath) {
          fm.hasMath = true;
        }
        if (extracted.hasMermaid) {
          fm.hasMermaid = true;
        }
      }
    };
  };
}

/**
 * @param {MarkdownNode} tree
 * @returns {Record<string, unknown>}
 */
function extractFromTree(tree) {
  /** @type {Set<string>} */
  const headings = new Set();
  /** @type {Set<string>} */
  const codeLangs = new Set();
  /** @type {Set<string>} */
  const images = new Set();
  /** @type {Set<string>} */
  const links = new Set();
  let hasMath = false;
  let hasMermaid = false;

  walk(tree, (node) => {
    if (node.type === 'heading') {
      const text = extractText(node);
      if (text) {
        headings.add(text);
      }
    }
    if (node.type === 'code' && node.lang) {
      codeLangs.add(node.lang);
      if (node.lang === 'mermaid') {
        hasMermaid = true;
      }
    }
    if (node.type === 'image' && node.url) {
      images.add(node.url);
    }
    if (node.type === 'link' && node.url) {
      links.add(node.url);
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
  if (headings.size > 0) {
    result.headings = [...headings];
  }
  if (codeLangs.size > 0) {
    result.codeLangs = [...codeLangs];
  }
  if (images.size > 0) {
    result.images = [...images];
  }
  if (links.size > 0) {
    result.links = [...links];
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
