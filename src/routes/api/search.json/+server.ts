import { json } from '@sveltejs/kit';
import { getManifestPosts } from '$lib/manifest';

export const prerender = true;

export async function GET() {
  const posts = getManifestPosts();

  // We only send the necessary fields for display
  const searchData = posts.map((post) => ({
    slug: post.slug,
    title: post.frontmatter.title,
    tags: post.frontmatter.tags ?? [],
    created: post.frontmatter.created,
  }));

  const { Document } = await import('flexsearch');
  const index = new Document({
    document: {
      id: 'slug',
      index: ['title', 'tags'],
      store: ['slug', 'title', 'tags', 'created'],
    },
    tokenize: 'forward',
  });

  for (const post of searchData) {
    index.add(post);
  }

  // biome-ignore lint/suspicious/noExplicitAny: FlexSearch export is a key-value store
  const exported: Record<string, any> = {};
  index.export((key, val) => {
    exported[key] = val;
  });

  return json({
    posts: searchData,
    index: exported,
  });
}
