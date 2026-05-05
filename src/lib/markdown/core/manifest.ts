import { readFileSync } from 'node:fs';

interface ContentManifest {
  pipelineVersion: string;
  buildEpoch?: number;
  posts: ManifestPost[];
}

interface ManifestPost {
  slug: string;
  frontmatter: {
    title: string;
    description?: string;
    created: string;
    updated?: string;
    draft?: boolean;
    tags?: string[];
    canonical?: string;
  };
  flags: Record<string, boolean>;
  extracted: {
    readingTime: number;
    contentHash?: string;
    metadataHash: string;
    assets: string[];
    headings?: string[];
    codeLangs?: string[];
    images?: string[];
    links?: string[];
    hasMath?: boolean;
    hasMermaid?: boolean;
  };
}

const MANIFEST_PATH = 'target/generated/content-manifest.json';

function loadManifest(): ContentManifest {
  const raw = readFileSync(MANIFEST_PATH, 'utf-8');
  return JSON.parse(raw) as ContentManifest;
}

export function getManifestPosts(): ManifestPost[] {
  return loadManifest().posts;
}
