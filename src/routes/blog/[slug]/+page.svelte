<script lang="ts">
import '$shared/styles/content.css';
import { page } from '$app/state';
import { getPosts } from '$entities/post/api';
import { theme } from '$features/theme/model/theme.svelte';
import { site } from '$shared/config/site';
import { copy } from '$shared/lib/actions/copy';
import { mermaid } from '$shared/lib/actions/mermaid';
import Seo from '$shared/ui/Seo.svelte';
import PostFooter from '$widgets/post/ui/PostFooter.svelte';
import PostHeader from '$widgets/post/ui/PostHeader.svelte';

const modules = import.meta.glob('/src/content/blog/**/*.md', { eager: true }) as Record<
  string,
  { default: ConstructorOfATypedSvelteComponent }
>;

function pathToSlug(path: string): string {
  return path.split('/').pop()?.replace('.md', '') ?? '';
}

const post = $derived(getPosts().find((item) => item.slug === page.params.slug));
const postContentPath = $derived(
  Object.keys(modules).find((path) => pathToSlug(path) === page.params.slug)
);
const PostContent = $derived(postContentPath ? modules[postContentPath]?.default : undefined);
</script>

{#if post}
  <Seo
    title={post.title}
    description={post.summary}
    type="article"
    url={`${site.url}/blog/${post.slug}`}
    publishedTime={post.created}
    modifiedTime={post.updated}
    tags={post.tags}
  />

  <article class="max-w-3xl mx-auto px-6 pt-24 pb-14">
    <PostHeader {post} />

    <div class="prose" use:mermaid={theme.current} use:copy>
      {#if PostContent}
        <PostContent />
      {/if}
    </div>

    <PostFooter />
  </article>
{/if}
