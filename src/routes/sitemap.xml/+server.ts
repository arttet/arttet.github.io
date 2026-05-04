import { getManifestPosts } from '$lib/manifest';
import { site } from '$shared/config/site';

export const prerender = true;

export async function GET() {
  const posts = getManifestPosts();
  const pages = ['', '/blog', '/about'];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (page) => `
    <url>
      <loc>${site.url}${page}</loc>
      <changefreq>daily</changefreq>
      <priority>${page === '' ? '1.0' : '0.8'}</priority>
    </url>`
    )
    .join('')}
  ${posts
    .map(
      (post) => `
    <url>
      <loc>${site.url}/blog/${post.slug}</loc>
      <lastmod>${new Date(post.frontmatter.updated || post.frontmatter.created).toISOString().split('T')[0]}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>`
    )
    .join('')}
</urlset>`;

  return new Response(sitemap.trim(), {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
