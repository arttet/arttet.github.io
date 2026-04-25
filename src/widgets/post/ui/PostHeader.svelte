<script lang="ts">
import { browser } from '$app/environment';
import type { Post } from '$entities/post/post';
import TagList from '$entities/post/ui/TagList.svelte';

const { post } = $props<{ post: Post }>();

let progress = $state(0);
const displayDate = $derived(
  post.updated && post.updated !== post.created ? post.updated : post.created
);
const displayDateLabel = $derived(post.updated && post.updated !== post.created ? 'Updated ' : '');

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
      <TagList tags={post.tags} max={5} />
    {/if}
  </div>
</header>
