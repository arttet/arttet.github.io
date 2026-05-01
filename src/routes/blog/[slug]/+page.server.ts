import type { Component } from 'svelte';
import { render } from 'svelte/server';
import { error } from '@sveltejs/kit';
import { getPosts } from '$entities/post/api';
import { buildPostPageData } from './page-data';

const postModules = import.meta.glob('/content/blog/**/*.md') as Record<
  string,
  () => Promise<{ default: Component }>
>;

function pathToSlug(path: string): string {
  return path.split('/').pop()?.replace('.md', '') ?? '';
}

export function entries() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function load({ params }: { params: { slug: string } }) {
  const posts = getPosts();
  const index = posts.findIndex((item) => item.slug === params.slug);

  if (index === -1) {
    error(404, 'Post not found');
  }

  const postContentEntry = Object.entries(postModules).find(
    ([path]) => pathToSlug(path) === params.slug
  );

  if (!postContentEntry) {
    error(404, 'Post content not found');
  }

  const PostContent = (await postContentEntry[1]()).default;
  const { body: postHtml, head: postHead } = render(PostContent);

  return buildPostPageData(posts, index, postHtml, postHead);
}
