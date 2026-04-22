<script lang="ts">
import type { Post } from '$entities/post/post';
import PostCard from '$entities/post/ui/PostCard.svelte';

const { posts } = $props<{ posts: Post[] }>();

let expandedTags = $state<Set<number>>(new Set());

function toggleExpand(index: number) {
  if (expandedTags.has(index)) {
    expandedTags.delete(index);
  } else {
    expandedTags.add(index);
  }
  expandedTags = new Set(expandedTags);
}
</script>

{#if posts.length === 0}
  <p class="text-[--color-text-muted] font-mono text-sm">No posts found.</p>
{:else}
  <ul class="space-y-6">
    {#each posts as post, i}
      <li><PostCard {post} index={i} {expandedTags} onToggleExpand={toggleExpand} /></li>
    {/each}
  </ul>
{/if}
