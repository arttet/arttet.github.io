/**
 * JSON Schema describing the expected shape of blog post frontmatter.
 * Used for static validation and IDE autocompletion.
 */
export const frontmatterSchema = Object.freeze({
	$schema: 'http://json-schema.org/draft-07/schema#',
	type: 'object',
	required: ['title', 'created', 'tags'],
	properties: Object.freeze({
			cover: Object.freeze({ type: 'string' }),
		title: Object.freeze({ type: 'string', minLength: 1 }),
		created: Object.freeze({
			type: 'string',
			pattern: '^\\d{4}-\\d{2}-\\d{2}',
			description: 'ISO 8601 date (YYYY-MM-DD)',
		}),
		updated: Object.freeze({
			type: 'string',
			pattern: '^\\d{4}-\\d{2}-\\d{2}',
			description: 'ISO 8601 date (YYYY-MM-DD)',
		}),
		tags: Object.freeze({
			type: 'array',
			minItems: 1,
			items: Object.freeze({ type: 'string', minLength: 1 }),
		}),
		draft: Object.freeze({ type: 'boolean' }),
		summary: Object.freeze({ type: 'string' }),
		toc: Object.freeze({ type: 'boolean' }),
	}),
	additionalProperties: false,
});

/**
 * Lightweight schema validator that checks required fields and basic types.
 * Does not need an external JSON Schema engine.
 *
 * @param {unknown} data
 * @param {string} [_filePath]
 * @returns {string[]}
 */
export function validateFrontmatterSchema(data, _filePath = '') {
	/** @type {string[]} */
	const errors = [];

	if (!data || typeof data !== 'object') {
		errors.push('Frontmatter must be an object.');
		return errors;
	}

	/** @type {Record<string, unknown>} */
	const obj = /** @type {Record<string, unknown>} */ (data);

	for (const key of frontmatterSchema.required) {
		if (!(key in obj)) {
			errors.push(`Missing required frontmatter field: "${key}".`);
		}
	}

	for (const key of Object.keys(obj)) {
		if (!Object.hasOwn(frontmatterSchema.properties, key)) {
			errors.push(`Unknown frontmatter field: "${key}".`);
		}
	}

	for (const [key, spec] of Object.entries(frontmatterSchema.properties)) {
		const value = obj[key];
		if (value === undefined) {
continue;
}

		if (spec.type === 'string' && typeof value !== 'string') {
			errors.push(`Frontmatter "${key}" must be a string.`);
		} else if (spec.type === 'boolean' && typeof value !== 'boolean') {
			errors.push(`Frontmatter "${key}" must be a boolean.`);
		} else if (spec.type === 'array' && !Array.isArray(value)) {
			errors.push(`Frontmatter "${key}" must be an array.`);
		} else if (
			spec.type === 'array' &&
			Array.isArray(value) &&
			spec.items?.type === 'string' &&
			value.some((v) => typeof v !== 'string' || v.length === 0)
		) {
			errors.push(`Frontmatter "${key}" must be an array of non-empty strings.`);
		}
	}

	return errors;
}
