import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Seo from './Seo.svelte';

describe('Seo', () => {
  it('updates title and meta tags', () => {
    render(Seo, {
      title: 'Custom Title',
      description: 'Custom Description',
    });

    // Svelte:head injects into real document.head in testing-library
    expect(document.title).toContain('Custom Title');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Custom Description');

    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute('content')).toContain('Custom Title');

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toBe('https://arttet.github.io/og-image.png');

    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');
  });

  it('renders JSON-LD correctly', () => {
    render(Seo, {
      type: 'article',
      title: 'Post Title',
      publishedTime: '2026-04-21',
    });

    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    const json = JSON.parse(script?.textContent?.trim() || '{}');
    expect(json['@type']).toBe('BlogPosting');
    expect(json.headline).toBe('Post Title');
    expect(json.datePublished).toBe('2026-04-21');
    expect(json.image).toBe('https://arttet.github.io/og-image.png');
  });

  it('supports an explicit social image override', () => {
    render(Seo, {
      title: 'Custom Image',
      image: '/posts/custom-card.png',
    });

    const ogImage = document.querySelector('meta[property="og:image"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');

    expect(ogImage?.getAttribute('content')).toBe('https://arttet.github.io/posts/custom-card.png');
    expect(twitterImage?.getAttribute('content')).toBe(
      'https://arttet.github.io/posts/custom-card.png'
    );
  });
});
