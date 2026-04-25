<script lang="ts">
import type { Post } from '$entities/post/post';

const { prevPost = null, nextPost = null } = $props<{
  prevPost?: Post | null;
  nextPost?: Post | null;
}>();
</script>

<footer class="mt-16 pt-8 border-t border-[--color-border]">
  <div class="flex items-center justify-between">
    <a
      href="/blog"
      class="inline-flex items-center gap-1.5 text-sm text-accent
				       hover:text-heading transition-colors font-mono"
    >
      ← All posts
    </a>
    <button
      type="button"
      onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      class="text-sm font-mono transition-opacity hover:opacity-70 text-accent"
    >
      ↑ Top
    </button>
  </div>

  {#if prevPost || nextPost}
    <nav class="flex items-center justify-between mt-6 gap-4" aria-label="Post navigation">
      {#if prevPost}
        <a
          href={`/blog/${prevPost.slug}`}
          class="group flex flex-col gap-0.5 text-sm font-mono text-accent hover:text-heading transition-colors max-w-[45%]"
        >
          <span class="text-xs text-[--color-text-muted]">← Older</span>
          <span class="truncate group-hover:underline">{prevPost.title}</span>
        </a>
      {:else}
        <span></span>
      {/if}
      {#if nextPost}
        <a
          href={`/blog/${nextPost.slug}`}
          class="group flex flex-col gap-0.5 text-sm font-mono text-accent hover:text-heading transition-colors text-right max-w-[45%]"
        >
          <span class="text-xs text-[--color-text-muted]">Newer →</span>
          <span class="truncate group-hover:underline">{nextPost.title}</span>
        </a>
      {:else}
        <span></span>
      {/if}
    </nav>
  {/if}
</footer>
