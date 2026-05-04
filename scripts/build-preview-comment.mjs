import { appendFileSync } from 'node:fs';

const entries = [
  ['App Preview', process.env.APP_PREVIEW_URL],
  ['Docs Preview', process.env.DOCS_PREVIEW_URL],
  ['Infra Root', process.env.INFRA_ROOT_URL],
  ['Playwright Report', process.env.PLAYWRIGHT_URL],
  ['Lighthouse Report', process.env.LIGHTHOUSE_URL],
].filter(([, value]) => typeof value === 'string' && value.length > 0);

const lines = ['## Preview Deployments', ''];

if (entries.length === 0) {
  lines.push(
    '- Cloudflare preview deploys were skipped or no browsable infra artifacts were produced.'
  );
} else {
  for (const [label, value] of entries) {
    lines.push(`- ${label}: ${value}`);
  }
}

appendFileSync(process.env.GITHUB_OUTPUT, `body<<EOF\n${lines.join('\n')}\nEOF\n`);
