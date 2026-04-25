<script lang="ts">
  import '$shared/styles/content.css';
  import type { PageData } from './$types';
  import { theme } from '$features/theme/model/theme.svelte';
  import { site } from '$shared/config/site';
  import { copy } from '$shared/lib/actions/copy';
  import { mermaid } from '$shared/lib/actions/mermaid';
  import Seo from '$shared/ui/Seo.svelte';
  import PostFooter from '$widgets/post/ui/PostFooter.svelte';
  import PostHeader from '$widgets/post/ui/PostHeader.svelte';
  import TableOfContents from '$widgets/post/ui/TableOfContents.svelte';

  const { data } = $props<{ data: PageData }>();

  const modules = import.meta.glob('/src/content/blog/**/*.md', {
    eager: true,
  }) as Record<string, { default: ConstructorOfATypedSvelteComponent }>;

  function pathToSlug(path: string): string {
    return path.split('/').pop()?.replace('.md', '') ?? '';
  }

  const postContentPath = $derived(
    Object.keys(modules).find((path) => pathToSlug(path) === data.post.slug),
  );
  const PostContent = $derived(
    postContentPath ? modules[postContentPath]?.default : undefined,
  );
</script>

<Seo
  title={data.post.title}
  description={data.post.summary}
  type="article"
  url={`${site.url}/blog/${data.post.slug}`}
  publishedTime={data.post.created}
  modifiedTime={data.post.updated}
  tags={data.post.tags}
/>

<div class="flex justify-center gap-12 px-6 pt-24 pb-14">
  <article class="min-w-0 w-full max-w-3xl">
    <PostHeader post={data.post} />

    <div class="prose" use:mermaid={theme.current} use:copy>
      {#if PostContent}
        <PostContent />
      {/if}
    </div>

    <PostFooter prevPost={data.prevPost} nextPost={data.nextPost} />
  </article>

  {#if data.post.toc !== false}
    <aside class="hidden lg:block w-52 shrink-0">
      <div class="sticky top-8 pt-16">
        <TableOfContents />
      </div>
    </aside>
  {/if}
</div>
