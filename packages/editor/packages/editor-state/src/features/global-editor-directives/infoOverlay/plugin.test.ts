import { describe, expect, it } from 'vitest';

import { parseBlockDirectives } from '../../code-blocks/utils/parseBlockDirectives';
import { resolveGlobalEditorDirectives } from '../registry';

function createParsedBlock(code: string[]) {
	return {
		parsedDirectives: parseBlockDirectives(code),
	};
}

describe('@infoOverlay directive', () => {
	it('resolves on', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @infoOverlay on', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.infoOverlay).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it('resolves off', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @infoOverlay off', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.infoOverlay).toBe(false);
		expect(result.errors).toEqual([]);
	});

	it('accepts boolean aliases', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @infoOverlay false', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.infoOverlay).toBe(false);
		expect(result.errors).toEqual([]);
	});

	it('allows duplicate identical values across blocks', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @infoOverlay on', 'moduleEnd']),
				createParsedBlock(['module b', '; @infoOverlay true', 'moduleEnd']),
			],
			{}
		);

		expect(result.resolved.infoOverlay).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it('reports conflicting values', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @infoOverlay on', 'moduleEnd']),
				createParsedBlock(['module b', '; @infoOverlay off', 'moduleEnd']),
			],
			{}
		);

		expect(result.resolved.infoOverlay).toBe(true);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('conflicting values');
	});

	it('reports missing arguments', () => {
		const result = resolveGlobalEditorDirectives([createParsedBlock(['module a', '; @infoOverlay', 'moduleEnd'])], {});

		expect(result.resolved.infoOverlay).toBeUndefined();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('requires exactly 1 argument');
	});

	it('reports unsupported values', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @infoOverlay maybe', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.infoOverlay).toBeUndefined();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('unsupported value');
	});

	it('suggests the closest supported value for typos', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @infoOverlay of', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.infoOverlay).toBeUndefined();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain("Did you mean 'off'?");
	});
});
