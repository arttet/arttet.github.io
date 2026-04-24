import { appendFileSync } from 'node:fs';

const runId = process.env.GITHUB_RUN_ID;
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;

if (!runId || !repository || !token) {
  throw new Error('GITHUB_RUN_ID, GITHUB_REPOSITORY, and GITHUB_TOKEN are required.');
}

const response = await fetch(
  `https://api.github.com/repos/${repository}/actions/runs/${runId}/artifacts?per_page=100`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  }
);

if (!response.ok) {
  throw new Error(`Unable to list workflow artifacts: ${response.status} ${response.statusText}`);
}

const payload = await response.json();
const artifactNames = new Set((payload.artifacts ?? []).map((artifact) => artifact.name));
const expectedArtifacts = [
  ['cloudflare-pages', 'has_cloudflare_pages'],
  ['playwright-report-chrome-desktop', 'has_pw_chrome_desktop'],
  ['playwright-report-chrome-mobile', 'has_pw_chrome_mobile'],
  ['playwright-report-firefox-desktop', 'has_pw_firefox_desktop'],
  ['playwright-report-firefox-mobile', 'has_pw_firefox_mobile'],
  ['lighthouse-report-chrome-desktop', 'has_lh_chrome_desktop'],
  ['lighthouse-report-chrome-mobile', 'has_lh_chrome_mobile'],
  ['bundle-report', 'has_bundle_report'],
];

const lines = expectedArtifacts.map(
  ([artifactName, outputName]) => `${outputName}=${artifactNames.has(artifactName)}`
);

appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
