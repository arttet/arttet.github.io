import { KNOWLEDGE_GRAPH_VERSION } from '../constants.js';

export const knowledgeGraphVersion = KNOWLEDGE_GRAPH_VERSION;

/**
 * @typedef {'post' | 'tag' | 'image' | 'code' | 'heading' | 'project'} KnowledgeGraphNodeType
 */

/**
 * @typedef {'tagged_with' | 'links_to' | 'contains_code' | 'contains_image' | 'references_heading' | 'mentions_project' | 'related_by_tag'} KnowledgeGraphEdgeType
 */

/**
 * @typedef {Object} KnowledgeGraphNode
 * @property {string} id
 * @property {KnowledgeGraphNodeType} type
 * @property {string} label
 * @property {Record<string, unknown>=} meta
 */

/**
 * @typedef {Object} KnowledgeGraphEdge
 * @property {string} from
 * @property {string} to
 * @property {KnowledgeGraphEdgeType} type
 * @property {Record<string, unknown>=} meta
 */

/**
 * @typedef {Object} KnowledgeGraph
 * @property {string} version
 * @property {KnowledgeGraphNode[]} nodes
 * @property {KnowledgeGraphEdge[]} edges
 */

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraph}
 */
export function createKnowledgeGraph(posts) {
  const postNodes = createPostNodes(posts);
  const tagNodes = createTagNodes(posts);
  const headingNodes = createHeadingNodes(posts);
  const codeNodes = createCodeNodes(posts);
  const imageNodes = createImageNodes(posts);
  const postTagEdges = createPostTagEdges(posts);
  const relatedPostEdges = createRelatedPostEdges(posts);
  const headingEdges = createHeadingEdges(posts);
  const codeEdges = createCodeEdges(posts);
  const imageEdges = createImageEdges(posts);
  const linkEdges = createLinkEdges(posts);
  return {
    version: knowledgeGraphVersion,
    nodes: [...postNodes, ...tagNodes, ...headingNodes, ...codeNodes, ...imageNodes].toSorted(
      compareNodes
    ),
    edges: [
      ...postTagEdges,
      ...relatedPostEdges,
      ...headingEdges,
      ...codeEdges,
      ...imageEdges,
      ...linkEdges,
    ].toSorted(compareEdges),
  };
}

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphNode[]}
 */
function createPostNodes(posts) {
  return posts.map((post) => ({
    id: toPostId(post.slug),
    type: 'post',
    label: post.title,
    meta: {
      slug: post.slug,
      created: post.created,
      updated: post.updated,
      tags: [...new Set(post.tags.map(normalizeTagSlug))].toSorted((a, b) => a.localeCompare(b)),
      hasMath: post.extracted?.hasMath ?? false,
      hasMermaid: post.extracted?.hasMermaid ?? false,
    },
  }));
}

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphNode[]}
 */
function createTagNodes(posts) {
  const tags = new Set(posts.flatMap((post) => post.tags.map(normalizeTagSlug)));

  return [...tags]
    .toSorted((a, b) => a.localeCompare(b))
    .map((tag) => ({
      id: toTagId(tag),
      type: 'tag',
      label: tag,
      meta: {
        slug: tag,
      },
    }));
}

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphEdge[]}
 */
function createPostTagEdges(posts) {
  return posts.flatMap((post) =>
    [...new Set(post.tags.map(normalizeTagSlug))]
      .toSorted((a, b) => a.localeCompare(b))
      .map((tag) => ({
        from: toPostId(post.slug),
        to: toTagId(tag),
        type: 'tagged_with',
      }))
  );
}

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphEdge[]}
 */
function createRelatedPostEdges(posts) {
  /** @type {Map<string, string[]>} */
  const tagToSlugs = new Map();

  for (const post of posts) {
    for (const tag of new Set(post.tags.map(normalizeTagSlug))) {
      const list = tagToSlugs.get(tag) ?? [];
      list.push(post.slug);
      tagToSlugs.set(tag, list);
    }
  }

  /** @type {Map<string, { from: string; to: string; tags: string[] }>} */
  const pairs = new Map();

  for (const [tag, slugs] of tagToSlugs) {
    for (let i = 0; i < slugs.length; i += 1) {
      for (let j = i + 1; j < slugs.length; j += 1) {
        const a = slugs[i];
        const b = slugs[j];
        const fromSlug = a < b ? a : b;
        const toSlug = a < b ? b : a;
        const key = `${fromSlug}|${toSlug}`;
        const pair = pairs.get(key);
        if (pair) {
          pair.tags.push(tag);
        } else {
          pairs.set(key, { from: toPostId(fromSlug), to: toPostId(toSlug), tags: [tag] });
        }
      }
    }
  }

  return [...pairs.values()]
    .map((p) => ({
      from: p.from,
      to: p.to,
      type: /** @type {const} */ ('related_by_tag'),
      meta: {
        weight: p.tags.length,
        tags: p.tags.toSorted((a, b) => a.localeCompare(b)),
      },
    }))
    .toSorted((a, b) => {
      const from = a.from.localeCompare(b.from);
      if (from !== 0) {
        return from;
      }
      return a.to.localeCompare(b.to);
    });
}


/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphNode[]}
 */
function createHeadingNodes(posts) {
  /** @type {Map<string, KnowledgeGraphNode>} */
  const nodes = new Map();
  for (const post of posts) {
    for (const heading of post.extracted?.headings ?? []) {
      const id = toHeadingId(post.slug, heading);
      if (!nodes.has(id)) {
        nodes.set(id, { id, type: 'heading', label: heading });
      }
    }
  }
  return [...nodes.values()];
}

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphNode[]}
 */
function createCodeNodes(posts) {
  /** @type {Map<string, KnowledgeGraphNode>} */
  const nodes = new Map();
  for (const post of posts) {
    for (const lang of post.extracted?.codeLangs ?? []) {
      const id = toCodeId(lang);
      if (!nodes.has(id)) {
        nodes.set(id, { id, type: 'code', label: lang });
      }
    }
  }
  return [...nodes.values()];
}

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphNode[]}
 */
function createImageNodes(posts) {
  /** @type {Map<string, KnowledgeGraphNode>} */
  const nodes = new Map();
  for (const post of posts) {
    for (const url of post.extracted?.images ?? []) {
      const id = toImageId(url);
      if (!nodes.has(id)) {
        nodes.set(id, { id, type: 'image', label: url });
      }
    }
  }
  return [...nodes.values()];
}

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphEdge[]}
 */
function createHeadingEdges(posts) {
  return posts.flatMap((post) =>
    (post.extracted?.headings ?? []).map((heading) => ({
      from: toPostId(post.slug),
      to: toHeadingId(post.slug, heading),
      type: /** @type {const} */ ('references_heading'),
    }))
  );
}

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphEdge[]}
 */
function createCodeEdges(posts) {
  return posts.flatMap((post) =>
    (post.extracted?.codeLangs ?? []).map((lang) => ({
      from: toPostId(post.slug),
      to: toCodeId(lang),
      type: /** @type {const} */ ('contains_code'),
    }))
  );
}

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphEdge[]}
 */
function createImageEdges(posts) {
  return posts.flatMap((post) =>
    (post.extracted?.images ?? []).map((url) => ({
      from: toPostId(post.slug),
      to: toImageId(url),
      type: /** @type {const} */ ('contains_image'),
    }))
  );
}

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphEdge[]}
 */
function createLinkEdges(posts) {
  return posts.flatMap((post) =>
    (post.extracted?.links ?? []).map((url) => ({
      from: toPostId(post.slug),
      to: toLinkId(url),
      type: /** @type {const} */ ('links_to'),
    }))
  );
}



/**
 * @param {string} slug
 * @param {string} heading
 */
function toHeadingId(slug, heading) {
  return `heading:${slug}#${heading
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^a-z0-9-]/g, '')
    .replaceAll(/--+/g, '-')
    .replaceAll(/^-|-$/g, '')}`;
}

/**
 * @param {string} lang
 */
function toCodeId(lang) {
  return `code:${lang}`;
}

/**
 * @param {string} url
 */
function toImageId(url) {
  return `image:${url}`;
}

/**
 * @param {string} url
 */
function toLinkId(url) {
  return `link:${url}`;
}

/**
 * @param {KnowledgeGraphNode} a
 * @param {KnowledgeGraphNode} b
 */
function compareNodes(a, b) {
  const type = a.type.localeCompare(b.type);
  if (type !== 0) {
return type;
}
  return a.id.localeCompare(b.id);
}

/**
 * @param {KnowledgeGraphEdge} a
 * @param {KnowledgeGraphEdge} b
 */
function compareEdges(a, b) {
  const from = a.from.localeCompare(b.from);
  if (from !== 0) {
return from;
}

  const to = a.to.localeCompare(b.to);
  if (to !== 0) {
return to;
}

  return a.type.localeCompare(b.type);
}

/**
 * @param {string} slug
 */
function toPostId(slug) {
  return `post:${slug}`;
}

/**
 * @param {string} tag
 */
function toTagId(tag) {
  return `tag:${normalizeTagSlug(tag)}`;
}

/**
 * @param {string} tag
 */
function normalizeTagSlug(tag) {
  return tag.trim().toLowerCase().replaceAll(/\s+/g, '-');
}
