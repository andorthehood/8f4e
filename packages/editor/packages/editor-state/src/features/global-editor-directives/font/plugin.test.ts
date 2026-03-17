import { describe, expect, it } from 'vitest';

import { parseBlockDirectives } from '../../code-blocks/utils/parseBlockDirectives';
import { resolveGlobalEditorDirectives } from '../registry';

function createParsedBlock(code: string[]) {
	return {
		parsedDirectives: parseBlockDirectives(code),
	};
}

describe('@font directive', () => {
	it('resolves a supported font', () => {
		const result = resolveGlobalEditorDirectives([createParsedBlock(['module a', '; @font 6x10', 'moduleEnd'])], {});

		expect(result.resolved.font).toBe('6x10');
		expect(result.errors).toEqual([]);
	});

	it('allows duplicate identical values across blocks', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @font 6x10', 'moduleEnd']),
				createParsedBlock(['module b', '; @font 6x10', 'moduleEnd']),
			],
			{}
		);

		expect(result.resolved.font).toBe('6x10');
		expect(result.errors).toEqual([]);
	});

	it('reports conflicting values', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @font 6x10', 'moduleEnd']),
				createParsedBlock(['module b', '; @font 8x16', 'moduleEnd']),
			],
			{}
		);

		expect(result.resolved.font).toBe('6x10');
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('conflicting values');
	});

	it('reports unsupported fonts', () => {
		const result = resolveGlobalEditorDirectives([createParsedBlock(['module a', '; @font tiny', 'moduleEnd'])], {});

		expect(result.resolved.font).toBeUndefined();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('unsupported font');
	});
});
