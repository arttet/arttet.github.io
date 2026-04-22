import { getPosts } from '$entities/post/api.server';
import { site } from '$shared/config/site';
import { escXml } from '$shared/lib/escXml';

export const prerender = true;

export function GET() {
  const posts = getPosts();

  // Use the most recent post's date as the feed updated date, or current date if no posts
  const feedUpdated =
    posts.length > 0
      ? new Date(
          Math.max(...posts.map((p) => new Date(p.updated || p.created).getTime()))
        ).toISOString()
      : new Date().toISOString();

  const entries = posts
    .map((post) => {
      const postUrl = `${site.url}/blog/${post.slug}`;
      const updatedDate = new Date(post.updated || post.created).toISOString();
      const publishedDate = new Date(post.created).toISOString();

      return `
	<entry>
		<title>${escXml(post.title)}</title>
		<link href="${postUrl}" />
		<id>${postUrl}</id>
		<published>${publishedDate}</published>
		<updated>${updatedDate}</updated>
		${post.summary ? `<summary type="text">${escXml(post.summary)}</summary>` : ''}
		${post.tags.map((t) => `<category term="${escXml(t)}" />`).join('\n\t\t')}
	</entry>`;
    })
    .join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
	<title>${escXml(site.title)}</title>
	<subtitle>${escXml(site.description)}</subtitle>
	<link href="${site.url}/atom.xml" rel="self" type="application/atom+xml" />
	<link href="${site.url}/" />
	<id>${site.url}/</id>
	<updated>${feedUpdated}</updated>
	<author>
		<name>${escXml(site.author.name)}</name>
	</author>
	${entries}
</feed>`;

  return new Response(body.trim(), {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'max-age=3600',
    },
  });
}
