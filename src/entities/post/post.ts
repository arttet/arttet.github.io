export interface PostFrontmatter {
  title: string;
  tags: string[];
  created: string; // ISO 8601 date string
  updated?: string;
  draft?: boolean;
  summary?: string;
}

export type Post = PostFrontmatter & {
  slug: string;
  readingTime: number; // minutes
};
