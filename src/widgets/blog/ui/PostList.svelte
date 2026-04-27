<script lang="ts">
import type { Post } from '$entities/post/post';
import PostCard from '$entities/post/ui/PostCard.svelte';

const { posts } = $props<{ posts: Post[] }>();
</script>

{#if posts.length === 0}
  <p class="text-[--color-text-muted] font-mono text-sm">No posts found.</p>
{:else}
  <ul class="space-y-6">
    {#each posts as post (post.slug)}
      <li><PostCard {post} /></li>
    {/each}
  </ul>
{/if}
