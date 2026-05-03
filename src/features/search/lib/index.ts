import type { Post } from '$entities/post/post';

export type SearchResult = Pick<Post, 'slug' | 'title' | 'tags' | 'created'>;

export interface SearchPayload {
  posts: SearchResult[];
  index: Record<string, any>;
}
let index: import('flexsearch').Document<SearchResult> | null = null;

export async function buildIndex(data: SearchPayload): Promise<void> {
  const { Document } = await import('flexsearch');

  index = new Document<SearchResult>({
    document: {
      id: 'slug',
      index: ['title', 'tags'],
      store: ['slug', 'title', 'tags', 'created'],
    },
    tokenize: 'forward',
  });

  if (data.index && Object.keys(data.index).length > 0) {
    for (const [key, val] of Object.entries(data.index)) {
      index.import(key, val);
    }
  } else {
    for (const post of data.posts) {
      index.add(post);
    }
  }
}

export async function search(query: string): Promise<SearchResult[]> {
  if (!index || !query.trim()) {
    return [];
  }

  const raw = index.search(query, { enrich: true, limit: 8 });

  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const field of raw) {
    for (const item of field.result) {
      const doc = item.doc as SearchResult;
      if (!seen.has(doc.slug)) {
        seen.add(doc.slug);
        results.push(doc);
      }
    }
  }

  return results;
}
