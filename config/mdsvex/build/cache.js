import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PIPELINE_VERSION } from '../constants.js';

const cacheDir = '.cache/mdsvex/posts';

/**
 * @param {string} filePath
 * @param {string} content
 * @returns {string}
 */
export function computeCacheKey(filePath, content) {
	return createHash('sha256').update(`${filePath}\0${content}`).digest('hex');
}

/**
 * @param {string} cacheKey
 * @returns {Promise<{ version: string; post: import('../../../src/entities/post/post').Post; diagnostics: import('../engine/diagnostics.js').Diagnostic[] } | null>}
 */
export async function loadCachedPost(cacheKey) {
	const path = join(cacheDir, `${cacheKey}.json`);
	if (!existsSync(path)) {
		return null;
	}
	try {
		const raw = await readFile(path, 'utf8');
		const cached = JSON.parse(raw);
		if (cached.version !== PIPELINE_VERSION) {
			return null;
		}
		return cached;
	} catch {
		return null;
	}
}

/**
 * @param {string} cacheKey
 * @param {import('../../../src/entities/post/post').Post} post
 * @param {import('../engine/diagnostics.js').Diagnostic[]} diagnostics
 */
export async function saveCachedPost(cacheKey, post, diagnostics) {
	const path = join(cacheDir, `${cacheKey}.json`);
	await mkdir(cacheDir, { recursive: true });
	const payload = {
		version: PIPELINE_VERSION,
		post,
		diagnostics,
	};
	await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}
