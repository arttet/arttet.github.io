<script lang="ts">
import { page } from '$app/state';
import { getPosts } from '$entities/post/api';
import Seo from '$shared/ui/Seo.svelte';
import BlogHeader from '$widgets/blog/ui/BlogHeader.svelte';
import PostList from '$widgets/blog/ui/PostList.svelte';

const tag = $derived(page.params.tag ?? '');
const posts = $derived(getPosts().filter((post) => post.tags.includes(tag)));
</script>

<Seo title={`#${tag} — Blog`} description={`Articles tagged ${tag}`} />

<section class="max-w-3xl mx-auto px-6 pt-24 pb-16">
  <BlogHeader {tag} count={posts.length} />
  <PostList {posts} />
</section>
