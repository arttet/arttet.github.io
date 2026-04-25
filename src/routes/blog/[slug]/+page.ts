import { error } from '@sveltejs/kit';
import { getPosts } from '$entities/post/api';

export const prerender = true;

export function entries() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export function load({ params }: { params: { slug: string } }) {
  const posts = getPosts();
  const index = posts.findIndex((item) => item.slug === params.slug);

  if (index === -1) {
    error(404, 'Post not found');
  }

  return {
    post: posts[index],
    prevPost: posts[index + 1] ?? null,
    nextPost: posts[index - 1] ?? null,
  };
}
