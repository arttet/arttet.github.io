import { describe, expect, it } from 'vitest';
import { frontmatterSchema, validateFrontmatterSchema, getFrontmatterJSONSchema } from './frontmatter-schema.js';

describe('frontmatter schema', () => {
	it('exports a valid zod schema and JSON schema representation', () => {
		const jsonSchema = getFrontmatterJSONSchema();
		expect(jsonSchema.type).toBe('object');
		expect(jsonSchema.required).toContain('title');
		expect(jsonSchema.required).toContain('created');
		expect(jsonSchema.required).not.toContain('tags');
		expect(typeof frontmatterSchema.parse).toBe('function');
	});

	it('passes valid frontmatter', () => {
		const errors = validateFrontmatterSchema({
			title: 'Hello',
			created: '2026-04-20',
			tags: ['blog'],
		});
		expect(errors).toEqual([]);
	});

	it('reports missing required fields', () => {
		const errors = validateFrontmatterSchema({});
		expect(errors).toContainEqual(expect.stringContaining('title'));
		expect(errors).toContainEqual(expect.stringContaining('created'));
	});

	it('reports type mismatches', () => {
		const errors = validateFrontmatterSchema({
			title: 'Hello',
			created: '2026-04-20',
			tags: ['blog'],
			draft: 'yes',
		});
		expect(errors).toHaveLength(1);
		expect(errors[0]).toContain('draft');
		expect(errors[0].toLowerCase()).toContain('boolean');
	});

	it('accepts description and canonical fields', () => {
		const errors = validateFrontmatterSchema({
			title: 'Hello',
			created: '2026-04-20',
			description: 'A short description.',
			canonical: 'https://example.com/hello',
		});
		expect(errors).toEqual([]);
	});

	it('reports unknown fields', () => {
		const errors = validateFrontmatterSchema({
			title: 'Hello',
			created: '2026-04-20',
			tags: ['blog'],
			unknownField: 'value',
		});
		expect(errors).toHaveLength(1);
		expect(errors[0].toLowerCase()).toContain('unrecognized');
		expect(errors[0]).toContain('unknownField');
	});
});
