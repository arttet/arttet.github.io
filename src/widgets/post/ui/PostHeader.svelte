<script lang="ts">
import { browser } from '$app/environment';
import type { Post } from '$entities/post/post';

const { post } = $props<{ post: Post }>();

let progress = $state(0);
let expandedTags = $state(false);
const MAX_VISIBLE_TAGS = 5;
const displayDate = $derived(
  post.updated && post.updated !== post.created ? post.updated : post.created
);
const displayDateLabel = $derived(post.updated && post.updated !== post.created ? 'Updated ' : '');

function toggleTags() {
  expandedTags = !expandedTags;
}

$effect(() => {
  if (!browser) {
    return;
  }

  function onScroll() {
    const el = document.documentElement;
    const scrolled = el.scrollTop;
    const total = el.scrollHeight - el.clientHeight;
    progress = total > 0 ? scrolled / total : 0;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
</script>

<!-- Reading progress bar -->
<div
  class="fixed top-0 left-0 z-nav h-[2px] bg-accent transition-none pointer-events-none"
  style="width: {progress * 100}%"
  aria-hidden="true"
></div>

<!-- Back link -->
<a
  href="/blog"
  class="inline-flex items-center gap-1.5 text-xs font-mono text-accent
		       hover:text-heading transition-colors mb-10"
>
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M7.5 2L3.5 6L7.5 10"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
  Back to blog
</a>

<header class="mb-12">
  <h1 class="text-[2rem] font-bold text-heading leading-tight tracking-tight mb-5">{post.title}</h1>

  {#if post.summary}
    <p class="text-lg text-text-muted leading-relaxed mb-5">{post.summary}</p>
  {/if}

  <div class="pt-5 border-t border-border">
    <!-- Date left — reading time right -->
    <div class="flex items-center justify-between gap-4">
      <time datetime={displayDate} class="text-sm font-mono text-text-muted">
        {displayDateLabel}{formatDate(displayDate)}
      </time>
      <div class="flex items-center gap-3">
        <span class="text-sm font-mono text-text-muted">
          {post.readingTime}
          min read
        </span>
      </div>
    </div>

    <!-- Tags centered -->
    {#if post.tags.length}
      <div class="flex flex-wrap items-center justify-center gap-1.5 pt-2">
        {#each post.tags as tag, ti}
          {#if expandedTags || ti < MAX_VISIBLE_TAGS}
            <a
              href={`/blog/tag/${tag}`}
              class="px-2 py-0.5 rounded text-xs font-mono
								       bg-black/5 dark:bg-white/5 text-accent
								       hover:bg-black/10 dark:hover:bg-white/10
								       transition-colors duration-[150ms]"
            >
              #{tag}
            </a>
          {/if}
        {/each}
        {#if post.tags.length > MAX_VISIBLE_TAGS && !expandedTags}
          <button
            type="button"
            onclick={toggleTags}
            class="px-2 py-0.5 rounded text-xs font-mono
							       bg-black/5 dark:bg-white/5 hover:opacity-70
							       transition-opacity duration-[150ms] cursor-pointer text-accent"
          >
            +{post.tags.length - MAX_VISIBLE_TAGS}
            more
          </button>
        {/if}
        {#if post.tags.length > MAX_VISIBLE_TAGS && expandedTags}
          <button
            type="button"
            onclick={toggleTags}
            class="px-2 py-0.5 rounded text-xs font-mono
							       bg-black/5 dark:bg-white/5 hover:opacity-70
							       transition-opacity duration-[150ms] cursor-pointer text-accent"
          >
            show less
          </button>
        {/if}
      </div>
    {/if}
  </div>
</header>
