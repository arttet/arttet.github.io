import { createHash } from 'node:crypto';

export const pipelineVersion = 'sprint-7-manifest-v1';

/**
 * @typedef {Object} ContentManifestPost
 * @property {string} slug
 * @property {string} title
 * @property {string=} summary
 * @property {string} created
 * @property {string=} updated
 * @property {string[]} tags
 * @property {number} readingTime
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
 * @param {import('../../src/entities/post/post').Post[]} posts
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
          tags: post.tags.toSorted((a, b) => a.localeCompare(b)),
          readingTime: post.readingTime,
        };

        return {
          ...entry,
          metadataHash: hashMetadata(entry),
          features: createEmptyFeatures(),
          assets: [],
        };
      })
      .toSorted((a, b) => {
        const date = b.created.localeCompare(a.created);
        if (date !== 0) return date;
        return a.slug.localeCompare(b.slug);
      }),
  };
}

/**
 * @param {Pick<ContentManifestPost, 'slug' | 'title' | 'summary' | 'created' | 'updated' | 'tags' | 'readingTime'>} entry
 */
function hashMetadata(entry) {
  return createHash('sha256').update(JSON.stringify(entry)).digest('hex');
}

function createEmptyFeatures() {
  return {
    hasMath: false,
    hasMermaid: false,
    hasCode: false,
    hasCodeTabs: false,
    hasImages: false,
    hasOptimizedImages: false,
    hasPriorityImage: false,
    hasImageLightbox: false,
    hasInteractiveBlocks: false,
  };
}
