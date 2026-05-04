import { createHash } from 'node:crypto';
import { FEATURE_FLAGS, PIPELINE_VERSION } from '../constants.js';

export const pipelineVersion = PIPELINE_VERSION;

/**
 * @typedef {Object} ContentManifestPost
 * @property {string} slug
 * @property {import('./frontmatter-schema.js').frontmatterSchema} frontmatter
 * @property {Record<string, boolean>} flags
 * @property {Object} extracted
 * @property {number} extracted.readingTime
 * @property {string} [extracted.contentHash]
 * @property {string} extracted.metadataHash
 * @property {string[]} extracted.assets
 * @property {string[]} [extracted.headings]
 * @property {string[]} [extracted.codeLangs]
 * @property {string[]} [extracted.images]
 * @property {string[]} [extracted.links]
 * @property {boolean} [extracted.hasMath]
 * @property {boolean} [extracted.hasMermaid]
 */

/**
 * @typedef {Object} ContentManifest
 * @property {string} pipelineVersion
 * @property {number} [buildEpoch]
 * @property {ContentManifestPost[]} posts
 */

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @param {{ buildEpoch?: number }} [options]
 * @returns {ContentManifest}
 */
export function createContentManifest(posts, options = {}) {
  /** @type {ContentManifest} */
  const manifest = {
    pipelineVersion,
    posts: posts
      .map((post) => createManifestPost(post))
      .toSorted((a, b) => {
        const date = b.frontmatter.created.localeCompare(a.frontmatter.created);
        if (date !== 0) {
          return date;
        }
        return a.slug.localeCompare(b.slug);
      }),
  };

  if (options.buildEpoch !== undefined) {
    manifest.buildEpoch = options.buildEpoch;
  }

  return manifest;
}

/**
 * @param {import('../../../src/entities/post/post').Post} post
 * @returns {ContentManifestPost}
 */
function createManifestPost(post) {
  const frontmatter = {
    title: post.title,
    created: post.created,
    ...(post.summary !== undefined && { description: post.summary }),
    ...(post.description !== undefined && { description: post.description }),
    ...(post.updated !== undefined && { updated: post.updated }),
    ...(post.draft !== undefined && { draft: post.draft }),
    ...(post.tags !== undefined && { tags: [...post.tags].toSorted((a, b) => a.localeCompare(b)) }),
    ...(post.canonical !== undefined && { canonical: post.canonical }),
  };

  const extracted = {
    readingTime: post.readingTime,
    contentHash: post.contentHash,
    metadataHash: hashMetadata({
      slug: post.slug,
      title: post.title,
      description: post.description ?? post.summary,
      created: post.created,
      updated: post.updated,
      tags: post.tags,
      readingTime: post.readingTime,
      contentHash: post.contentHash,
    }),
    assets: [],
    ...(post.extracted?.headings !== undefined && { headings: post.extracted.headings }),
    ...(post.extracted?.codeLangs !== undefined && { codeLangs: post.extracted.codeLangs }),
    ...(post.extracted?.images !== undefined && { images: post.extracted.images }),
    ...(post.extracted?.links !== undefined && { links: post.extracted.links }),
    ...(post.extracted?.hasMath !== undefined && { hasMath: post.extracted.hasMath }),
    ...(post.extracted?.hasMermaid !== undefined && { hasMermaid: post.extracted.hasMermaid }),
  };

  return {
    slug: post.slug,
    frontmatter,
    flags: createFeatures(post),
    extracted,
  };
}

/**
 * @param {Object} entry
 * @param {string} entry.slug
 * @param {string} entry.title
 * @param {string|undefined} entry.description
 * @param {string} entry.created
 * @param {string|undefined} entry.updated
 * @param {string[]|undefined} entry.tags
 * @param {number} entry.readingTime
 * @param {string|undefined} entry.contentHash
 */
function hashMetadata(entry) {
  return createHash('sha256').update(JSON.stringify(entry)).digest('hex');
}

/**
 * @param {import('../../../src/entities/post/post').Post} post
 */
function createFeatures(post) {
  return {
    [FEATURE_FLAGS.HAS_MATH]: post.extracted?.hasMath ?? false,
    [FEATURE_FLAGS.HAS_MERMAID]: post.extracted?.hasMermaid ?? false,
    [FEATURE_FLAGS.HAS_CODE]: post.hasCode ?? false,
    [FEATURE_FLAGS.HAS_CODE_TABS]: post.hasCodeTabs ?? false,
    [FEATURE_FLAGS.HAS_IMAGES]: post.hasImages ?? false,
    [FEATURE_FLAGS.HAS_OPTIMIZED_IMAGES]: false,
    [FEATURE_FLAGS.HAS_PRIORITY_IMAGE]: false,
    [FEATURE_FLAGS.HAS_IMAGE_LIGHTBOX]: false,
    [FEATURE_FLAGS.HAS_INTERACTIVE_BLOCKS]: false,
  };
}
