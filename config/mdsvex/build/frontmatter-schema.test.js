import { describe, expect, it } from 'vitest';
import { frontmatterSchema, validateFrontmatterSchema } from './frontmatter-schema.js';

describe('frontmatter schema', () => {
	it('exports a valid schema object', () => {
		expect(frontmatterSchema.type).toBe('object');
		expect(frontmatterSchema.required).toContain('title');
		expect(frontmatterSchema.required).toContain('created');
		expect(frontmatterSchema.required).not.toContain('tags');
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
		expect(errors).toEqual([
			'Missing required frontmatter field: "title".',
			'Missing required frontmatter field: "created".',
		]);
	});

	it('reports type mismatches', () => {
		const errors = validateFrontmatterSchema({
			title: 'Hello',
			created: '2026-04-20',
			tags: ['blog'],
			draft: 'yes',
		});
		expect(errors).toEqual(['Frontmatter "draft" must be a boolean.']);
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
		expect(errors).toEqual(['Unknown frontmatter field: "unknownField".']);
	});
});
