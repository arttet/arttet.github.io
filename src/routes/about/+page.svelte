<script lang="ts">
import { ArrowUpRight, GitFork } from 'lucide-svelte';
import { site } from '$shared/config/site';
import Logo from '$shared/ui/Logo.svelte';
import Seo from '$shared/ui/Seo.svelte';

const modules = import.meta.glob('/src/content/pages/about.md', {
  eager: true,
}) as Record<string, { default: ConstructorOfATypedSvelteComponent }>;
const AboutContent = modules['/src/content/pages/about.md']?.default;
</script>

<Seo title="About" description={site.about.description} />

<article class="max-w-3xl mx-auto px-6 pt-24 pb-14">
  <header class="mb-12 flex items-center gap-4">
    <a
      href="/"
      aria-label="Home"
      class="shrink-0 hover:scale-105 transition-transform duration-200"
    >
      <Logo size="w-10 h-10" shadow="drop-shadow-sm" />
    </a>
    <h1 class="text-4xl font-bold text-[--color-heading] tracking-tight">About</h1>
  </header>

  <div
    class="max-w-2xl text-base leading-8 text-[--color-text] [&_p]:my-6 [&_a]:text-[--color-accent] [&_a]:underline [&_a]:underline-offset-3 [&_a]:decoration-1 [&_a:hover]:no-underline [&_strong]:font-semibold [&_strong]:text-[--color-heading]"
  >
    {#if AboutContent}
      <AboutContent />
    {/if}
  </div>

  <section class="mt-14">
    <div class="max-w-2xl">
      <h2 class="text-2xl font-semibold tracking-tight text-[--color-heading]">Projects</h2>
      <p class="mt-3 text-sm leading-7 text-[--color-text-muted]">
        If you want to know a bit more about how I work, some of my projects are a better
        introduction than a short bio.
      </p>
    </div>

    <div class="mt-6 grid gap-4 max-w-2xl">
      {#each site.about.projects as project}
        <a
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          class="group rounded-2xl border border-[--color-border] bg-[--color-bg-secondary] p-5 transition-colors duration-150 hover:bg-[--color-bg-elevated]"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-[--color-heading]">
                <GitFork size={16} />
                <h3 class="text-base font-semibold tracking-tight">{project.title}</h3>
              </div>
              <p class="mt-3 text-sm leading-7 text-[--color-text-muted]">{project.description}</p>
            </div>

            <div
              class="shrink-0 rounded-full border border-[--color-border] p-2 text-[--color-text-muted] transition-colors duration-150 group-hover:text-[--color-accent] group-hover:border-[--color-accent]"
            >
              <ArrowUpRight size={16} />
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            {#each project.tags as tag}
              <span
                class={`rounded-full border px-2.5 py-1 text-[11px] font-mono ${site.about.projectTagClasses[tag] ?? 'border-[--color-border] text-[--color-text-muted]'}`}
              >
                {tag}
              </span>
            {/each}
          </div>
        </a>
      {/each}
    </div>
  </section>
</article>
