<script lang="ts">
  import { resolve } from '$app/paths';
  import type { Post } from '$entities/post/post';

  const { prevPost = null, nextPost = null } = $props<{
    prevPost?: Post | null;
    nextPost?: Post | null;
  }>();

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      if (window.scrollY > 400) {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    });
  }
</script>

<footer class="mt-16 pt-8 border-t border-[--color-border]">
  {#if prevPost || nextPost}
    <nav class="grid grid-cols-2 gap-4 mb-8" aria-label="Post navigation">
      <div>
        {#if prevPost}
          <a
            href={resolve('/blog/[slug]', { slug: prevPost.slug })}
            class="group flex flex-col gap-1 p-5 h-full rounded-lg border border-[--color-border]
              hover:border-accent/50 hover:bg-[--color-bg-elevated] transition-all duration-200"
          >
            <span class="text-xs text-[--color-text-muted]">← Previous page</span>
            <span
              class="text-sm font-semibold text-[--color-heading] group-hover:text-accent
                transition-colors duration-150 line-clamp-2"
            >
              {prevPost.title}
            </span>
            {#if prevPost.summary}
              <span class="text-xs text-[--color-text-muted] line-clamp-2 mt-1">
                {prevPost.summary}
              </span>
            {/if}
          </a>
        {/if}
      </div>
      <div>
        {#if nextPost}
          <a
            href={resolve('/blog/[slug]', { slug: nextPost.slug })}
            class="group flex flex-col gap-1 p-5 h-full rounded-lg border border-[--color-border]
              hover:border-accent/50 hover:bg-[--color-bg-elevated] transition-all duration-200 text-right"
          >
            <span class="text-xs text-[--color-text-muted]">Next page →</span>
            <span
              class="text-sm font-semibold text-[--color-heading] group-hover:text-accent
                transition-colors duration-150 line-clamp-2"
            >
              {nextPost.title}
            </span>
            {#if nextPost.summary}
              <span class="text-xs text-[--color-text-muted] line-clamp-2 mt-1">
                {nextPost.summary}
              </span>
            {/if}
          </a>
        {/if}
      </div>
    </nav>
  {/if}

  <div class="flex items-center justify-between">
    <a
      href={resolve('/blog')}
      class="inline-flex items-center gap-1.5 text-sm text-accent hover:text-heading
        transition-colors font-mono"
    >
      ← All posts
    </a>
    <button
      type="button"
      onclick={scrollToTop}
      class="text-sm font-mono transition-opacity hover:opacity-70 text-accent"
    >
      ↑ Top
    </button>
  </div>
</footer>
