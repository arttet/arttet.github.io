import { building } from '$app/environment';
import { getPosts } from '$entities/post/api';
import type { Post } from '$entities/post/post';
import { site } from '$shared/config/site';

type BlogPageData = {
  posts: Post[];
  totalPosts: number;
  currentPage: number;
  pageCount: number;
  postsPerPage: number;
};

export function _parsePageParam(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function load({ url }: { url: URL }): BlogPageData {
  const allPosts = getPosts();
  const postsPerPage = site.blog.postsPerPage;
  const currentPage = building ? 1 : _parsePageParam(url.searchParams.get('page'));
  const pageCount = Math.max(1, Math.ceil(allPosts.length / postsPerPage));
  const safePage = Math.min(currentPage, pageCount);
  const start = (safePage - 1) * postsPerPage;

  return {
    posts: allPosts.slice(start, start + postsPerPage),
    totalPosts: allPosts.length,
    currentPage: safePage,
    pageCount,
    postsPerPage,
  };
}
