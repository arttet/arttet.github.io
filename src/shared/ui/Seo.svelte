<script lang="ts">
import { site } from '$shared/config/site';

let {
  title = site.title,
  description = site.description,
  type = 'website',
  url = site.url,
  image = site.images.og,
  publishedTime,
  modifiedTime,
  tags = [],
} = $props<{
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
}>();

const fullTitle = $derived(title === site.title ? title : `${title} — ${site.title}`);
const absoluteImage = $derived.by(() => {
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  const path = image.startsWith('/') ? image : `/${image}`;
  return `${site.url}${path}`;
});

const jsonLd = $derived.by(() => {
  const base = {
    '@context': 'https://schema.org',
    '@type': type === 'article' ? 'BlogPosting' : 'WebSite',
    name: fullTitle,
    description: description,
    url: url,
    image: absoluteImage,
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
  <meta property="og:image" content={absoluteImage}>

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
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content={fullTitle}>
  <meta name="twitter:description" content={description}>
  <meta name="twitter:image" content={absoluteImage}>

  <!-- RSS autodiscovery -->
  <link
    rel="alternate"
    type="application/rss+xml"
    title="{site.title} RSS"
    href="{site.url}/rss.xml"
  >
</svelte:head>
