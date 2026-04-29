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
  <article class="min-w-0 w-full max-w-[calc(48rem+3rem+13rem)]">
    <div class="max-w-3xl">
      <PostHeader post={data.post} />
    </div>

    <div class="grid min-w-0 gap-x-12 lg:grid-cols-[minmax(0,48rem)_13rem]">
      {#if data.post.toc !== false}
        <aside
          class="mb-4 min-w-0 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:mb-0 lg:w-52 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-auto"
        >
          <div>
            <TableOfContents />
          </div>
        </aside>
      {/if}

      <div class="min-w-0 lg:col-start-1 lg:row-start-1">
        {#key data.post.slug}
          <div class="prose" use:articleFocusPolicy use:mermaid={theme.current} use:copy>
            <!-- postHtml is trusted build-time mdsvex output from local src/content/blog files, not user input. -->
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html data.postHtml}
          </div>
        {/key}

        <PostFooter prevPost={data.prevPost} nextPost={data.nextPost} />
      </div>
    </div>
  </article>
</div>
