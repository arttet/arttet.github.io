export interface PostFrontmatter {
  title: string;
  tags: string[];
  created: string; // ISO 8601 date string
  updated?: string;
  draft?: boolean;
  summary?: string;
  toc?: boolean;
  hasMath?: boolean;
  hasMermaid?: boolean;
  hasCode?: boolean;
  hasCodeTabs?: boolean;
  hasImages?: boolean;
}

export type Post = PostFrontmatter & {
  slug: string;
  readingTime: number; // minutes
};
