<script lang="ts">
import type { Post } from '$entities/post/post';
import Seo from '$shared/ui/Seo.svelte';
import BlogHeader from '$widgets/blog/ui/BlogHeader.svelte';
import PostList from '$widgets/blog/ui/PostList.svelte';

type BlogPageData = {
  posts: Post[];
  totalPosts: number;
  currentPage: number;
  pageCount: number;
  postsPerPage: number;
};

let { data }: { data: BlogPageData } = $props();
</script>

<Seo title="Blog" description="Articles by Artyom Tetyukhin" />

<section class="max-w-3xl mx-auto px-6 pt-24 pb-16">
  <BlogHeader count={data.totalPosts} />
  <PostList posts={data.posts} />
</section>
