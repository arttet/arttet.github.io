import { z } from 'zod';

/**
 * Zod schema describing the expected shape of blog post frontmatter.
 * Used for runtime validation and native JSON Schema export via z.toJSONSchema().
 */
export const frontmatterSchema = z
	.object({
		title: z.string().min(1),
		created: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
		updated: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
		description: z.string().optional(),
		draft: z.boolean().optional(),
		tags: z.array(z.string().min(1)).min(1).optional(),
		canonical: z.string().min(1).optional(),
		summary: z.string().optional(),
	})
	.strict();



/**
 * @typedef {import('zod').infer<typeof frontmatterSchema>} FrontmatterInput
 */

/**
 * Generate a JSON Schema representation for IDE autocompletion and docs.
 * Uses Zod 4 native JSON Schema conversion.
 *
 * @returns {Record<string, unknown>}
 */
export function getFrontmatterJSONSchema() {
	return z.toJSONSchema(frontmatterSchema);
}

/**
 * Validate raw frontmatter data against the Zod schema.
 *
 * @param {unknown} data
 * @param {string} [_filePath]
 * @returns {string[]}
 */
export function validateFrontmatterSchema(data, _filePath = '') {
	if (!data || typeof data !== 'object') {
		return ['Frontmatter must be an object.'];
	}

	const result = frontmatterSchema.safeParse(data);
	if (result.success) {
		return [];
	}

	return result.error.issues.map((issue) => {
		const path = issue.path.join('.');
		if (path) {
			return `${path}: ${issue.message}`;
		}
		return issue.message;
	});
}
