import { error } from '@sveltejs/kit';
import { getPosts } from '$entities/post/api';

export const prerender = true;

export function entries() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export function load({ params }: { params: { slug: string } }) {
  const post = getPosts().find((item) => item.slug === params.slug);

  if (!post) {
    error(404, 'Post not found');
  }

  return { slug: post.slug };
}
