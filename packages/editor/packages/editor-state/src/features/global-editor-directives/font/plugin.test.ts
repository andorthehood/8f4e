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

	it('resolves the imported spleen5x8 font', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @font spleen5x8', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBe('spleen5x8');
		expect(result.errors).toEqual([]);
	});

	it('resolves the imported templeos8x8 font', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @font templeos8x8', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBe('templeos8x8');
		expect(result.errors).toEqual([]);
	});

	it('resolves the renamed ibmvga8x16 font', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @font ibmvga8x16', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBe('ibmvga8x16');
		expect(result.errors).toEqual([]);
	});

	it('resolves the imported kana12x13 font', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @font kana12x13', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBe('kana12x13');
		expect(result.errors).toEqual([]);
	});

	it('resolves the imported terminus10x18 font', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @font terminus10x18', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBe('terminus10x18');
		expect(result.errors).toEqual([]);
	});

	it('resolves the imported terminus8x16 font', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @font terminus8x16', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBe('terminus8x16');
		expect(result.errors).toEqual([]);
	});

	it('resolves the imported terminus8x16bold font', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @font terminus8x16bold', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBe('terminus8x16bold');
		expect(result.errors).toEqual([]);
	});

	it('resolves the imported terminus10x18bold font', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @font terminus10x18bold', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBe('terminus10x18bold');
		expect(result.errors).toEqual([]);
	});

	it('resolves the imported terminus12x24 font', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @font terminus12x24', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBe('terminus12x24');
		expect(result.errors).toEqual([]);
	});

	it('resolves the imported terminus12x24bold font', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @font terminus12x24bold', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBe('terminus12x24bold');
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
				createParsedBlock(['module b', '; @font ibmvga8x16', 'moduleEnd']),
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

	it('suggests the closest supported font for typos', () => {
		const result = resolveGlobalEditorDirectives(
			[createParsedBlock(['module a', '; @font terminus8x16bld', 'moduleEnd'])],
			{}
		);

		expect(result.resolved.font).toBeUndefined();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain("Did you mean 'terminus8x16bold'?");
	});
});
