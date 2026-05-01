import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';

/**
 * @typedef {NonNullable<import('mdsvex').MdsvexOptions['rehypePlugins']>[number]} RehypePluginEntry
 */

export function rehypeHeadingsStep() {
  return {
    name: 'rehype-headings',
    phase: /** @type {const} */ ('rehype'),
    mdsvex() {
      return {
        rehypePlugins: getRehypePlugins(),
      };
    },
  };
}

/**
 * @returns {import('mdsvex').MdsvexOptions['rehypePlugins']}
 */
function getRehypePlugins() {
  /** @type {import('mdsvex').MdsvexOptions['rehypePlugins']} */
  const plugins = [
    /** @type {RehypePluginEntry} */ (/** @type {unknown} */ (rehypeSlug)),
    /** @type {RehypePluginEntry} */ (
      /** @type {unknown} */ ([
        rehypeAutolinkHeadings,
        {
          behavior: 'prepend',
          test: ['h2'],
          properties: {
            className: ['anchor'],
            ariaHidden: true,
          },
          content: {
            type: 'text',
            value: '#',
          },
        },
      ])
    ),
  ];

  return plugins;
}
