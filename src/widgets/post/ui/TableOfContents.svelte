<script lang="ts">
import { browser } from '$app/environment';

let headings = $state<Array<{ id: string; text: string; level: number }>>([]);
let activeId = $state('');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

$effect(() => {
  if (!browser) return;

  const prose = document.querySelector('.prose');
  if (!prose) return;

  const nodes = Array.from(prose.querySelectorAll('h2, h3')) as HTMLElement[];
  if (nodes.length < 2) {
    headings = [];
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
    level: parseInt(node.tagName[1]),
  }));

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
    <p class="text-xs font-mono text-[--color-text-muted] uppercase tracking-wider mb-3">
      On this page
    </p>
    <ul class="space-y-1">
      {#each headings as h}
        <li style="padding-left: {(h.level - 2) * 12}px">
          <a
            href={`#${h.id}`}
            class="block text-xs font-mono py-0.5 transition-colors duration-150 truncate
              {activeId === h.id
              ? 'text-accent'
              : 'text-[--color-text-muted] hover:text-[--color-text]'}"
          >
            {h.text}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}
