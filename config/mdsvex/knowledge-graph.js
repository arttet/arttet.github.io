export const knowledgeGraphVersion = 'sprint-7-knowledge-graph-v1';

/**
 * @typedef {'post' | 'tag' | 'image' | 'code' | 'heading' | 'project'} KnowledgeGraphNodeType
 */

/**
 * @typedef {'tagged_with' | 'links_to' | 'contains_code' | 'contains_math' | 'contains_mermaid' | 'contains_image' | 'references_heading' | 'mentions_project' | 'related_by_tag'} KnowledgeGraphEdgeType
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
 * @param {import('../../src/entities/post/post').Post[]} posts
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
  const featureEdges = createFeatureEdges(posts);

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
      ...featureEdges,
    ].toSorted(compareEdges),
  };
}

/**
 * @param {import('../../src/entities/post/post').Post[]} posts
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
      tags: post.tags.toSorted((a, b) => a.localeCompare(b)),
    },
  }));
}

/**
 * @param {import('../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphNode[]}
 */
function createTagNodes(posts) {
  const tags = new Set(posts.flatMap((post) => post.tags));

  return [...tags]
    .toSorted((a, b) => a.localeCompare(b))
    .map((tag) => ({
      id: toTagId(tag),
      type: 'tag',
      label: tag,
      meta: {
        slug: normalizeTagSlug(tag),
      },
    }));
}

/**
 * @param {import('../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphEdge[]}
 */
function createPostTagEdges(posts) {
  return posts.flatMap((post) =>
    post.tags
      .toSorted((a, b) => a.localeCompare(b))
      .map((tag) => ({
        from: toPostId(post.slug),
        to: toTagId(tag),
        type: 'tagged_with',
      }))
  );
}

/**
 * @param {import('../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphEdge[]}
 */
function createRelatedPostEdges(posts) {
  const sortedPosts = posts.toSorted((a, b) => a.slug.localeCompare(b.slug));
  /** @type {KnowledgeGraphEdge[]} */
  const edges = [];

  for (let i = 0; i < sortedPosts.length; i += 1) {
    for (let j = i + 1; j < sortedPosts.length; j += 1) {
      const sharedTags = getSharedTags(sortedPosts[i], sortedPosts[j]);
      if (sharedTags.length === 0) continue;

      edges.push({
        from: toPostId(sortedPosts[i].slug),
        to: toPostId(sortedPosts[j].slug),
        type: 'related_by_tag',
        meta: {
          weight: sharedTags.length,
          tags: sharedTags,
        },
      });
    }
  }

  return edges;
}

/**
 * @param {import('../../src/entities/post/post').Post} first
 * @param {import('../../src/entities/post/post').Post} second
 * @returns {string[]}
 */
function getSharedTags(first, second) {
  const secondTags = new Set(second.tags);
  return first.tags.filter((tag) => secondTags.has(tag)).toSorted((a, b) => a.localeCompare(b));
}

/**
 * @param {import('../../src/entities/post/post').Post[]} posts
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
 * @param {import('../../src/entities/post/post').Post[]} posts
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
 * @param {import('../../src/entities/post/post').Post[]} posts
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
 * @param {import('../../src/entities/post/post').Post[]} posts
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
 * @param {import('../../src/entities/post/post').Post[]} posts
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
 * @param {import('../../src/entities/post/post').Post[]} posts
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
 * @param {import('../../src/entities/post/post').Post[]} posts
 * @returns {KnowledgeGraphEdge[]}
 */
function createFeatureEdges(posts) {
  /** @type {KnowledgeGraphEdge[]} */
  const edges = [];
  for (const post of posts) {
    if (post.extracted?.hasMath) {
      edges.push({
        from: toPostId(post.slug),
        to: `math:${post.slug}`,
        type: /** @type {const} */ ('contains_math'),
      });
    }
    if (post.extracted?.hasMermaid) {
      edges.push({
        from: toPostId(post.slug),
        to: `diagram:${post.slug}`,
        type: /** @type {const} */ ('contains_mermaid'),
      });
    }
  }
  return edges;
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
    .replaceAll(/[^a-z0-9-]/g, '')}`;
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
 * @param {KnowledgeGraphNode} a
 * @param {KnowledgeGraphNode} b
 */
function compareNodes(a, b) {
  const type = a.type.localeCompare(b.type);
  if (type !== 0) return type;
  return a.id.localeCompare(b.id);
}

/**
 * @param {KnowledgeGraphEdge} a
 * @param {KnowledgeGraphEdge} b
 */
function compareEdges(a, b) {
  const from = a.from.localeCompare(b.from);
  if (from !== 0) return from;

  const to = a.to.localeCompare(b.to);
  if (to !== 0) return to;

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
