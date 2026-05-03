import { createHash } from 'node:crypto';
import { FEATURE_FLAGS, PIPELINE_VERSION } from '../constants.js';

export const pipelineVersion = PIPELINE_VERSION;

/**
 * @typedef {Object} ContentManifestPost
 * @property {string} slug
 * @property {string} title
 * @property {string=} summary
 * @property {string} created
 * @property {string=} updated
 * @property {string[]} tags
 * @property {number} readingTime
 * @property {string=} contentHash
 * @property {string} metadataHash
 * @property {Record<string, boolean>} features
 * @property {string[]} assets
 */

/**
 * @typedef {Object} ContentManifest
 * @property {string} pipelineVersion
 * @property {ContentManifestPost[]} posts
 */

/**
 * @param {import('../../../src/entities/post/post').Post[]} posts
 * @returns {ContentManifest}
 */
export function createContentManifest(posts) {
  return {
    pipelineVersion,
    posts: posts
      .map((post) => {
        const entry = {
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          created: post.created,
          updated: post.updated,
          tags: [...post.tags].toSorted((a, b) => a.localeCompare(b)),
          readingTime: post.readingTime,
          contentHash: post.contentHash,
        };

        return {
          ...entry,
          metadataHash: hashMetadata(entry),
          features: createFeatures(post),
          assets: [],
        };
      })
      .toSorted((a, b) => {
        const date = b.created.localeCompare(a.created);
        if (date !== 0) {
return date;
}
        return a.slug.localeCompare(b.slug);
      }),
  };
}

/**
 * @param {Pick<ContentManifestPost, 'slug' | 'title' | 'summary' | 'created' | 'updated' | 'tags' | 'readingTime' | 'contentHash'>} entry
 */
function hashMetadata(entry) {
  return createHash('sha256').update(JSON.stringify(entry)).digest('hex');
}

/**
 * @param {import('../../../src/entities/post/post').Post} post
 */
function createFeatures(post) {
  return {
    [FEATURE_FLAGS.HAS_MATH]: post.hasMath ?? false,
    [FEATURE_FLAGS.HAS_MERMAID]: post.hasMermaid ?? false,
    [FEATURE_FLAGS.HAS_CODE]: post.hasCode ?? false,
    [FEATURE_FLAGS.HAS_CODE_TABS]: post.hasCodeTabs ?? false,
    [FEATURE_FLAGS.HAS_IMAGES]: post.hasImages ?? false,
    [FEATURE_FLAGS.HAS_OPTIMIZED_IMAGES]: false,
    [FEATURE_FLAGS.HAS_PRIORITY_IMAGE]: false,
    [FEATURE_FLAGS.HAS_IMAGE_LIGHTBOX]: false,
    [FEATURE_FLAGS.HAS_INTERACTIVE_BLOCKS]: false,
  };
}
