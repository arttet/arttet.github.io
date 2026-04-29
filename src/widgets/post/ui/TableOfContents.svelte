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

  function focusHeadingAnchor(id: string) {
    const heading = document.getElementById(id);
    const anchor = heading?.querySelector<HTMLAnchorElement>('.anchor[href]');
    anchor?.focus({ preventScroll: true });
  }

  function setActiveHeading(id: string) {
    activeId = id;
    requestAnimationFrame(() => {
      const nav = document.querySelector<HTMLElement>('nav[aria-label="Table of contents"]');
      const activeLink = Array.from(nav?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? []).find(
        (link) => link.hash.slice(1) === id
      );
      activeLink?.scrollIntoView?.({ block: 'nearest' });
    });
  }

  function onTocKeydown(event: KeyboardEvent, id: string) {
    if (event.key !== 'Enter') return;
    requestAnimationFrame(() => {
      focusHeadingAnchor(id);
      setActiveHeading(id);
    });
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

    headings = nodes.map((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.querySelector('.anchor')?.remove();
      return {
        id: node.id,
        text: clone.textContent?.trim() ?? '',
      };
    });
    activeId = '';

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0% -70% 0%' },
    );

    const onAnchorActivate = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (id) {
        setActiveHeading(id);
      }
    };

    window.addEventListener('article-anchor-activate', onAnchorActivate);
    for (const node of nodes) observer.observe(node);
    return () => {
      observer.disconnect();
      window.removeEventListener('article-anchor-activate', onAnchorActivate);
    };
  });
</script>

{#if headings.length >= 2}
  <nav aria-label="Table of contents">
    <p class="text-xs font-mono text-[--color-text-muted] mb-3">
      On this page
    </p>
    <ul class="space-y-0.5">
      {#each headings as h (h.id)}
        <li>
          <a
            href={`#${h.id}`}
            onkeydown={(event) => onTocKeydown(event, h.id)}
            class="block text-xs font-mono leading-snug py-1 pl-3 border-l-2 transition-all duration-150 whitespace-normal break-words [overflow-wrap:anywhere]
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
