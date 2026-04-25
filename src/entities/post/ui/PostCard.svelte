<script lang="ts">
import type { Post } from '$entities/post/post';
import TagList from './TagList.svelte';

const { post } = $props<{ post: Post }>();
</script>

<!-- Clickable card -->
<article
  class="group glass relative flex flex-col gap-3 p-6 rounded-xl transition-all duration-200 hover:border-accent/40"
>
  <!-- Title -->
  <h2
    class="text-lg font-semibold text-[--color-heading] leading-snug group-hover:text-accent transition-colors duration-[150ms]"
  >
    <a href={`/blog/${post.slug}`} class="after:absolute after:inset-0 after:z-0"> {post.title} </a>
  </h2>

  {#if post.summary}
    <p class="text-sm text-[--color-text-muted] leading-relaxed">{post.summary}</p>
  {/if}

  <!-- Date left — reading time right -->
  <div class="flex items-center justify-between gap-4 mt-1">
    <time class="text-xs font-mono text-[--color-text-muted] shrink-0">
      {new Date(post.created).toLocaleDateString(
        "en",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      )}
    </time>
    <span class="text-xs font-mono text-[--color-text-muted] shrink-0">
      {post.readingTime}
      min read
    </span>
  </div>

  <!-- Tags centered -->
  <div class="relative z-10">
    <TagList tags={post.tags} max={3} />
  </div>
</article>
