export interface PostFrontmatter {
  title: string;
  tags: string[];
  created: string; // ISO 8601 date string
  updated?: string;
  draft?: boolean;
  summary?: string;
  description?: string;
  canonical?: string;
  toc?: boolean;
  hasMath?: boolean;
  hasMermaid?: boolean;
  hasCode?: boolean;
  hasCodeTabs?: boolean;
  hasImages?: boolean;
  tocHeadings?: { depth: number; text: string; id: string }[];
  extracted?: {
    headings?: string[];
    codeLangs?: string[];
    images?: string[];
    links?: string[];
    hasMath?: boolean;
    hasMermaid?: boolean;
  };
}

export type Post = PostFrontmatter & {
  slug: string;
  readingTime: number; // minutes
  contentHash?: string;
};
