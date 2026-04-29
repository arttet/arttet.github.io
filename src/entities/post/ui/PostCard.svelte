<script lang="ts">
import { resolve } from '$app/paths';
import type { Post } from '$entities/post/post';
import TagList from './TagList.svelte';

const { post } = $props<{ post: Post }>();
</script>

<!-- Clickable card -->
<article
  class="group glass relative flex flex-col gap-3 p-6 rounded-xl transition-all duration-200 hover:border-accent/40"
>
  <a
    href={resolve('/blog/[slug]', { slug: post.slug })}
    aria-label={post.title}
    class="absolute inset-0 z-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
  ></a>

  <!-- Title -->
  <h2
    class="relative z-10 pointer-events-none text-lg font-semibold text-[--color-heading] leading-snug group-hover:text-accent transition-colors duration-[150ms]"
    style="view-transition-name: post-title-{post.slug}"
  >
    {post.title}
  </h2>

  {#if post.summary}
    <p class="relative z-10 pointer-events-none text-sm text-[--color-text-muted] leading-relaxed">
      {post.summary}
    </p>
  {/if}

  <!-- Date left — reading time right -->
  <div class="relative z-10 pointer-events-none flex items-center justify-between gap-4 mt-1">
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
