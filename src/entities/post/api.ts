import type { Post, PostFrontmatter } from './post';

type PostMetadata = PostFrontmatter & { readingTime: number };

const modules = import.meta.glob<PostMetadata>('/src/content/blog/**/*.md', {
  eager: true,
  import: 'metadata',
});

function pathToSlug(path: string): string {
  const filename = path.split('/').pop()?.replace('.md', '') ?? '';
  return filename;
}

function logContentIssue(message: string): void {
  const runtime = globalThis as typeof globalThis & {
    process?: { stderr?: { write?: (chunk: string) => unknown } };
  };

  if (runtime.process?.stderr?.write) {
    runtime.process.stderr.write(`${message}\n`);
  }
}

function getPostValidationErrors(metadata: PostMetadata | undefined): string[] {
  const errors: string[] = [];

  if (!metadata) {
    errors.push('metadata is missing');
    return errors;
  }

  if (typeof metadata.title !== 'string' || metadata.title.trim().length === 0) {
    errors.push('title must be a non-empty string');
  }

  if (typeof metadata.created !== 'string' || Number.isNaN(new Date(metadata.created).getTime())) {
    errors.push('created must be a valid ISO date string');
  }

  if (!Array.isArray(metadata.tags)) {
    errors.push('tags must be an array');
  }

  if (typeof metadata.readingTime !== 'number' || Number.isNaN(metadata.readingTime)) {
    errors.push('readingTime must be a number');
  }

  if (
    metadata.updated !== undefined &&
    (typeof metadata.updated !== 'string' || Number.isNaN(new Date(metadata.updated).getTime()))
  ) {
    errors.push('updated must be a valid ISO date string when provided');
  }

  return errors;
}

export function getPosts(): Post[] {
  const posts = Object.entries(modules)
    .flatMap(([path, metadata]) => {
      const errors = getPostValidationErrors(metadata);
      if (errors.length > 0) {
        logContentIssue(`[content] Skipping invalid post "${path}": ${errors.join('; ')}`);
        return [];
      }

      const slug = pathToSlug(path);
      return [Object.assign({}, metadata, { slug }) as Post];
    })
    .filter((post) => !post.draft)
    .toSorted((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      logContentIssue(`[content] Duplicate post slug detected: "${post.slug}"`);
    }
    seen.add(post.slug);
  }

  return posts;
}
