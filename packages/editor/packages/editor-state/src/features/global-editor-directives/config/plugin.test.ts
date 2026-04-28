import { describe, expect, it } from 'vitest';

import { parseBlockDirectives } from '../../code-blocks/utils/parseBlockDirectives';
import { resolveGlobalEditorDirectives } from '../registry';

function createParsedBlock(code: string[]) {
	return {
		parsedDirectives: parseBlockDirectives(code),
	};
}

describe('@config directive', () => {
	it('records config entries for validation and resolution', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock([
					'module a',
					'; @config font 6x10',
					'; @config color.text.code #112233',
					'; @config color.fill.wire rgba(1,2,3,0.4)',
					'moduleEnd',
				]),
			],
			{}
		);

		expect(result.resolved.configEntries).toEqual([
			{ path: 'font', value: '6x10', rawRow: 1, codeBlockId: 0 },
			{ path: 'color.text.code', value: '#112233', rawRow: 2, codeBlockId: 0 },
			{ path: 'color.fill.wire', value: 'rgba(1,2,3,0.4)', rawRow: 3, codeBlockId: 0 },
		]);
		expect(result.errors).toEqual([]);
	});

	it('lets validators handle path-specific meaning', () => {
		const result = resolveGlobalEditorDirectives(
			[
				createParsedBlock([
					'module a',
					'; @config font tiny',
					'; @config blockScale 4',
					'; @config color.text.code ???',
					'moduleEnd',
				]),
			],
			{}
		);

		expect(result.resolved.configEntries).toEqual([
			{ path: 'font', value: 'tiny', rawRow: 1, codeBlockId: 0 },
			{ path: 'blockScale', value: '4', rawRow: 2, codeBlockId: 0 },
			{ path: 'color.text.code', value: '???', rawRow: 3, codeBlockId: 0 },
		]);
		expect(result.errors).toEqual([]);
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

		expect(result.resolved).toEqual({});
		expect(result.errors).toEqual([]);
	});

	it('does not resolve removed top-level color directive', () => {
		const result = resolveGlobalEditorDirectives(
			[
				{
					parsedDirectives: [
						{
							prefix: '@',
							name: 'color',
							args: ['text.code', '#112233'],
							rawRow: 0,
							isTrailing: false,
						},
					],
				},
			],
			{}
		);

		expect(result.resolved).toEqual({});
		expect(result.errors).toEqual([]);
	});
});
