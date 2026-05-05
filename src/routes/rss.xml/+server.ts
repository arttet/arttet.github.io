import { getManifestPosts } from '$lib/markdown/core/manifest';
import { site } from '$shared/config/site';
import { escXml } from '$shared/lib/escXml';

export const prerender = true;

export function GET() {
  const posts = getManifestPosts();

  // Use the most recent post's date as the feed updated date, or current date if no posts
  const feedUpdated =
    posts.length > 0
      ? new Date(
          Math.max(
            ...posts.map((p) => new Date(p.frontmatter.updated || p.frontmatter.created).getTime())
          )
        ).toUTCString()
      : new Date().toUTCString();

  const entries = posts
    .map((post) => {
      const postUrl = `${site.url}/blog/${post.slug}`;
      const pubDate = new Date(post.frontmatter.created).toUTCString();

      return `
		<item>
			<title>${escXml(post.frontmatter.title)}</title>
			<link>${postUrl}</link>
			<guid isPermaLink="true">${postUrl}</guid>
			<pubDate>${pubDate}</pubDate>
			${post.frontmatter.description ? `<description>${escXml(post.frontmatter.description)}</description>` : ''}
			${(post.frontmatter.tags ?? []).map((t) => `<category>${escXml(t)}</category>`).join('\n\t\t')}
		</item>`;
    })
    .join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>${escXml(site.title)}</title>
		<description>${escXml(site.description)}</description>
		<link>${site.url}/</link>
		<atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />
		<lastBuildDate>${feedUpdated}</lastBuildDate>
		${entries}
	</channel>
</rss>`;

  return new Response(body.trim(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'max-age=3600',
    },
  });
}
