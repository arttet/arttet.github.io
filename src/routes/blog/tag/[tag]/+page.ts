import { getPosts } from '$entities/post/api';

export const prerender = true;

export function entries() {
  const tags = new Set(
    getPosts()
      .flatMap((post) => post.tags)
      .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
  );
  return Array.from(tags, (tag) => ({ tag }));
}
