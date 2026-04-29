import type { Post } from '$entities/post/post';

export function buildPostPageData(posts: Post[], index: number, postHtml: string) {
  return {
    post: posts[index],
    prevPost: posts[index + 1] ?? null,
    nextPost: posts[index - 1] ?? null,
    postHtml,
  };
}
