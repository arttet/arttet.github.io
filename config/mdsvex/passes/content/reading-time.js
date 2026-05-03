import { walk } from '../_internal/walk.js';

/**
 * @typedef {import('../_internal/walk.js').MarkdownNode} MarkdownNode
 */

export function readingTimePass() {
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

    walk(tree, (node) => {
      if (node.type === 'text' || node.type === 'inlineCode') {
        text += `${node.value} `;
      }
    });

    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const readingTime = Math.max(1, Math.round(words / 200));

    file.data.fm ??= {};
    file.data.fm.readingTime = readingTime;
  };
}
