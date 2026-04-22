<script lang="ts">
import { getPosts } from '$entities/post/api';
import Seo from '$shared/ui/Seo.svelte';
import BlogHeader from '$widgets/blog/ui/BlogHeader.svelte';
import PostList from '$widgets/blog/ui/PostList.svelte';

const posts = getPosts();
</script>

<Seo title="Blog" description="Articles by Artyom Tetyukhin" />

<section class="max-w-3xl mx-auto px-6 pt-24 pb-16">
  <BlogHeader count={posts.length} />
  <PostList {posts} />
</section>
