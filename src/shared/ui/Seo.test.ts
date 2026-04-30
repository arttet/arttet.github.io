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
    expect(ogImage?.getAttribute('content')).toMatch(
      /^https:\/\/arttet\.github\.io\/@imagetools\//
    );

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
    expect(json.image).toMatch(/^https:\/\/arttet\.github\.io\/@imagetools\//);
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

  it('supports relative image URLs not starting with slash', () => {
    render(Seo, {
      title: 'Relative Image',
      image: 'assets/image.png',
    });

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toBe('https://arttet.github.io/assets/image.png');
  });

  it('renders JSON-LD for WebSite correctly', () => {
    render(Seo, {
      type: 'website',
      title: 'Site Title',
    });

    const script = document.querySelector('script[type="application/ld+json"]');
    const json = JSON.parse(script?.textContent?.trim() || '{}');
    expect(json['@type']).toBe('WebSite');
  });

  it('supports absolute image URLs', () => {
    render(Seo, {
      title: 'Absolute Image',
      image: 'https://example.com/image.png',
    });

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toBe('https://example.com/image.png');
  });

  it('renders modifiedTime and tags correctly', () => {
    render(Seo, {
      title: 'Post Title',
      type: 'article',
      modifiedTime: '2026-04-22',
      tags: ['Svelte', 'Testing'],
    });

    const modifiedTime = document.querySelector('meta[property="article:modified_time"]');
    expect(modifiedTime?.getAttribute('content')).toBe('2026-04-22');

    const tags = document.querySelectorAll('meta[property="article:tag"]');
    expect(tags.length).toBe(2);
    expect(tags[0]?.getAttribute('content')).toBe('Svelte');
    expect(tags[1]?.getAttribute('content')).toBe('Testing');
  });
});
