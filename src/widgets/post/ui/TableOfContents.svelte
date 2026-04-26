<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';

  let headings = $state<Array<{ id: string; text: string }>>([]);
  let activeId = $state('');

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  $effect(() => {
    // Re-run on route change so navigating between posts rescans headings.
    void page.params.slug;

    if (!browser) return;

    const prose = document.querySelector('.prose');
    const nodes = prose
      ? (Array.from(prose.querySelectorAll('h2')) as HTMLElement[])
      : [];

    if (nodes.length < 2) {
      headings = [];
      activeId = '';
      return;
    }

    for (const node of nodes) {
      if (!node.id) {
        node.id = slugify(node.textContent ?? '');
      }
    }

    headings = nodes.map((node) => ({
      id: node.id,
      text: node.textContent ?? '',
    }));
    activeId = '';

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId = entry.target.id;
          }
        }
      },
      { rootMargin: '-20% 0% -70% 0%' },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  });
</script>

{#if headings.length >= 2}
  <nav aria-label="Table of contents">
    <p class="text-xs font-mono text-[--color-text-muted] mb-3">
      On this page
    </p>
    <ul class="space-y-0.5">
      {#each headings as h}
        <li>
          <a
            href={`#${h.id}`}
            class="block text-xs font-mono py-1 pl-3 border-l-2 transition-all duration-150 truncate
              {activeId === h.id
              ? 'border-accent text-[--color-text] font-medium'
              : 'border-transparent text-[--color-text-muted] hover:text-[--color-text] hover:border-[--color-border]'}"
          >
            {h.text}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}
