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
  const postTagEdges = createPostTagEdges(posts);
  const relatedPostEdges = createRelatedPostEdges(posts);

  return {
    version: knowledgeGraphVersion,
    nodes: [...postNodes, ...tagNodes].toSorted(compareNodes),
    edges: [...postTagEdges, ...relatedPostEdges].toSorted(compareEdges),
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
