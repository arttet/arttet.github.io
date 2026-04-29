<script lang="ts">
  import '$shared/styles/content.css';
  import type { PageData } from './$types';
  import { theme } from '$features/theme/model/theme.svelte';
  import { site } from '$shared/config/site';
  import { articleFocusPolicy } from '$shared/lib/actions/articleFocusPolicy';
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

<div class="flex justify-center px-6 pt-24 pb-32">
  <article
    class="grid min-w-0 w-full max-w-[calc(48rem+3rem+13rem)] gap-x-12 lg:grid-cols-[minmax(0,48rem)_13rem]"
  >
    <div class="min-w-0 lg:col-start-1">
      <PostHeader post={data.post} />
    </div>

    {#if data.post.toc !== false}
      <aside class="mb-10 min-w-0 lg:col-start-2 lg:row-start-1 lg:mb-0 lg:w-52 lg:self-start">
        <div class="lg:sticky lg:top-8 lg:pt-16">
          <TableOfContents />
        </div>
      </aside>
    {/if}

    <div class="min-w-0 lg:col-start-1">
      {#key data.post.slug}
        <div class="prose" use:articleFocusPolicy use:mermaid={theme.current} use:copy>
          {#if PostContent}
            <PostContent />
          {/if}
        </div>
      {/key}

      <PostFooter prevPost={data.prevPost} nextPost={data.nextPost} />
    </div>
  </article>
</div>
