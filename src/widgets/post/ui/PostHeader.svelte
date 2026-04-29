<script lang="ts">
  import { browser } from '$app/environment';
  import { resolve } from '$app/paths';
  import type { Post } from '$entities/post/post';
  import Breadcrumb from '$shared/ui/Breadcrumb.svelte';
  import type { RouteSegment } from '$shared/ui/Breadcrumb.svelte';
  import TagList from '$entities/post/ui/TagList.svelte';

  const { post } = $props<{ post: Post }>();

  let progress = $state(0);
  let milestones = $state<number[]>([]);

  const displayDate = $derived(
    post.updated && post.updated !== post.created ? post.updated : post.created,
  );
  const displayDateLabel = $derived(
    post.updated && post.updated !== post.created ? 'Updated ' : '',
  );
  const breadcrumbItems: RouteSegment[] = $derived([
    { label: 'Home', href: resolve('/'), isHome: true },
    { label: 'Blog', href: resolve('/blog') },
    { label: post.title },
  ]);

  $effect(() => {
    if (!browser) return;

    function onScroll() {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      progress = total > 0 ? scrolled / total : 0;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  $effect(() => {
    if (!browser) return;

    const raf = requestAnimationFrame(() => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      milestones = Array.from(document.querySelectorAll<HTMLElement>('.prose h2')).map(
        (h) => h.offsetTop / total,
      );
    });

    return () => cancelAnimationFrame(raf);
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

<!-- Milestone marks (full-width track behind progress bar) -->
{#if milestones.length}
  <div
    class="fixed top-0 left-0 z-nav w-full h-[2px] pointer-events-none"
    aria-hidden="true"
  >
    {#each milestones as pos, i (i)}
      <div
        class="absolute top-0 h-full w-px bg-[--color-text-muted]/30"
        style="left: {pos * 100}%"
      ></div>
    {/each}
  </div>
{/if}

<Breadcrumb items={breadcrumbItems} />

<header class="mb-4 lg:mb-6">
  <h1
    class="text-[2rem] font-bold text-heading leading-tight tracking-tight mb-5"
    style="view-transition-name: post-title-{post.slug}"
  >{post.title}</h1>

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
