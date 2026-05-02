/**
 * @typedef {Object} MarkdownNode
 * @property {string=} type
 * @property {string=} value
 * @property {string=} url
 * @property {string=} alt
 * @property {number=} depth
 * @property {MarkdownNode[]=} children
 * @property {{ start: { line: number; column: number } }=} position
 */

/**
 * @param {MarkdownNode} node
 * @param {(node: MarkdownNode) => void} visit
 */
export function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) {
    walk(child, visit);
  }
}
