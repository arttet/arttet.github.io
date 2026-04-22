<script lang="ts">
import { site } from '$shared/config/site';

let {
  title = site.title,
  description = site.description,
  type = 'website',
  url = site.url,
  publishedTime,
  modifiedTime,
  tags = [],
} = $props<{
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
}>();

const fullTitle = $derived(title === site.title ? title : `${title} — ${site.title}`);

const jsonLd = $derived.by(() => {
  const base = {
    '@context': 'https://schema.org',
    '@type': type === 'article' ? 'BlogPosting' : 'WebSite',
    name: fullTitle,
    description: description,
    url: url,
    author: {
      '@type': 'Person',
      name: site.author.name,
      url: site.url,
    },
  };

  if (type === 'article') {
    return {
      ...base,
      headline: title,
      datePublished: publishedTime,
      dateModified: modifiedTime || publishedTime,
      keywords: tags.join(', '),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
    };
  }

  return base;
});

const jsonLdScript = $derived(
  ['<script type="application/ld+json">', JSON.stringify(jsonLd), '</', 'script>'].join('')
);
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description}>

  <!-- JSON-LD -->
  {@html jsonLdScript}

  <!-- Open Graph -->
  <meta property="og:site_name" content={site.title}>
  <meta property="og:type" content={type}>
  <meta property="og:url" content={url}>
  <meta property="og:title" content={fullTitle}>
  <meta property="og:description" content={description}>

  {#if publishedTime}
    <meta property="article:published_time" content={publishedTime}>
  {/if}
  {#if modifiedTime}
    <meta property="article:modified_time" content={modifiedTime}>
  {/if}
  {#each tags as tag}
    <meta property="article:tag" content={tag}>
  {/each}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content={fullTitle}>
  <meta name="twitter:description" content={description}>

  <!-- RSS autodiscovery -->
  <link
    rel="alternate"
    type="application/rss+xml"
    title="{site.title} RSS"
    href="{site.url}/rss.xml"
  >
</svelte:head>
