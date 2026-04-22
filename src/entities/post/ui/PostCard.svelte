<script lang="ts">
import type { Post } from '$entities/post/post';

const { post, index, expandedTags, onToggleExpand } = $props<{
  post: Post;
  index: number;
  expandedTags: Set<number>;
  onToggleExpand: (index: number) => void;
}>();

const MAX_VISIBLE_TAGS = 3;
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
  <div class="relative z-10 flex flex-wrap items-center justify-center gap-1.5 pt-2">
    {#each post.tags as t, ti}
      {#if expandedTags.has(index) || ti < MAX_VISIBLE_TAGS}
        <a
          href={`/blog/tag/${t}`}
          class="px-2 py-0.5 rounded text-xs font-mono bg-black/5 dark:bg-white/5 text-accent hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-150"
        >
          #{t}
        </a>
      {/if}
    {/each}
    {#if post.tags.length > MAX_VISIBLE_TAGS && !expandedTags.has(index)}
      <button
        type="button"
        onclick={() => onToggleExpand(index)}
        class="px-2 py-0.5 rounded text-xs font-mono bg-black/5 dark:bg-white/5 hover:opacity-70 transition-opacity duration-[150ms] cursor-pointer text-accent"
      >
        +{post.tags.length - MAX_VISIBLE_TAGS}
        more
      </button>
    {/if}
    {#if post.tags.length > MAX_VISIBLE_TAGS && expandedTags.has(index)}
      <button
        type="button"
        onclick={() => onToggleExpand(index)}
        class="px-2 py-0.5 rounded text-xs font-mono bg-black/5 dark:bg-white/5 hover:opacity-70 transition-opacity duration-[150ms] cursor-pointer text-accent"
      >
        show less
      </button>
    {/if}
  </div>
</article>
