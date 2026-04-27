import { describe, expect, it } from 'vitest';
import { FONT_NAMES } from '@8f4e/sprite-generator';

import { parseBlockDirectives } from '../../code-blocks/utils/parseBlockDirectives';
import { resolveGlobalEditorDirectives } from '../registry';

function createParsedBlock(code: string[]) {
	return {
		parsedDirectives: parseBlockDirectives(code),
	};
}

describe('@config directive', () => {
	it.each(FONT_NAMES)('resolves supported font %s', font => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', `; @config font ${font}`, 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBe(font);
		expect(result.errors).toEqual([]);
	});

	it('allows duplicate identical font values across blocks', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @config font 6x10', 'moduleEnd']),
				createParsedBlock(['module b', '; @config font 6x10', 'moduleEnd']),
			],
			{}
		);

		expect(result.resolved.font).toBe('6x10');
		expect(result.errors).toEqual([]);
	});

	it('reports conflicting font values', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock(['module a', '; @config font 6x10', 'moduleEnd']),
				createParsedBlock(['module b', '; @config font ibmvga8x16', 'moduleEnd']),
			],
			{}
		);

		expect(result.resolved.font).toBe('6x10');
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('conflicting values');
	});

	it('reports unsupported fonts', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @config font tiny', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBeUndefined();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('unsupported font');
	});

	it('suggests the closest supported font for typos', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @config font terminus8x16bld', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBeUndefined();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain("Did you mean 'terminus8x16bold'?");
	});

	it('reports unknown config paths', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @config blockScale 4', 'moduleEnd'])],
			{}
		);

		expect(result.resolved).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain("unknown config path 'blockScale'");
	});

	it('requires exactly a path and value', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @config', '; @config font', '; @config font ibmvga8x16 extra', 'moduleEnd'])],
			{}
		);

		expect(result.resolved).toEqual({});
		expect(result.errors).toHaveLength(3);
		expect(result.errors.every(error => error.message.includes('requires exactly 2 arguments'))).toBe(true);
	});

	it('does not resolve removed top-level font directive', () => {
		const result = resolveGlobalEditorDirectives([createParsedBlock(['module a', '; @font 6x10', 'moduleEnd'])], {});

		expect(result.resolved.font).toBeUndefined();
		expect(result.errors).toEqual([]);
	});
});
