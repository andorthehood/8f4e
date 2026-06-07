import { describe, expect, it } from 'vitest';

import { pickProjectCompilerBlocks } from './pickProjectCompilerBlocks';

const validModuleBlock = ['module counter', '', 'int count', '', 'moduleEnd'];
const validFunctionBlock = ['function sine', 'param float x', 'functionEnd float'];
const validMacroBlock = ['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'];
const validPrototypeBlock = ['prototype oscillatorState', 'float phase', 'float frequency 440', 'prototypeEnd'];
const validNoteBlock = ['note', '; @pos 2 3', 'remember to tune this later', 'noteEnd'];

describe('pickProjectCompilerBlocks', () => {
	it('splits project blocks into compiler inputs', () => {
		const blocks = [
			{ id: 1, code: validModuleBlock, entry: 'main' },
			{ id: 2, code: validFunctionBlock },
			{ id: 3, code: validPrototypeBlock },
			{ id: 4, code: validMacroBlock },
			{ id: 5, code: validNoteBlock },
			{ id: 6, code: validModuleBlock, entry: 'main', disabled: true },
		];

		expect(pickProjectCompilerBlocks({ codeBlocks: blocks, groups: [] })).toEqual({
			entries: { main: [{ code: validModuleBlock, projectBlockId: 1 }] },
			constantsBlocks: [],
			functionBlocks: [{ code: validFunctionBlock, projectBlockId: 2 }],
			prototypeBlocks: [{ code: validPrototypeBlock, projectBlockId: 3 }],
			macroBlocks: [{ code: validMacroBlock, projectBlockId: 4 }],
			groups: [],
		});
	});

	it('splits grouped blocks only into their group tree', () => {
		expect(
			pickProjectCompilerBlocks({
				codeBlocks: [{ id: 1, code: ['module root', 'moduleEnd'], entry: 'main' }],
				groups: [
					{
						name: 'audio',
						entry: 'main',
						codeBlocks: [
							{ id: 2, code: validModuleBlock, entry: 'main' },
							{ id: 3, code: validFunctionBlock, entry: 'main' },
							{ id: 4, code: ['constants', 'const int tableSize 16', 'constantsEnd'], entry: 'main' },
							{ id: 5, code: validPrototypeBlock, entry: 'main' },
						],
						groups: [
							{
								name: 'nested',
								entry: 'main',
								codeBlocks: [{ id: 6, code: validMacroBlock, entry: 'main' }],
								groups: [],
							},
						],
					},
				],
			})
		).toEqual({
			entries: { main: [{ code: ['module root', 'moduleEnd'], projectBlockId: 1 }] },
			constantsBlocks: [],
			functionBlocks: [],
			prototypeBlocks: [],
			macroBlocks: [],
			groups: [
				{
					name: 'audio',
					entry: 'main',
					modules: [{ code: validModuleBlock, projectBlockId: 2 }],
					constantsBlocks: [{ code: ['constants', 'const int tableSize 16', 'constantsEnd'], projectBlockId: 4 }],
					functionBlocks: [{ code: validFunctionBlock, projectBlockId: 3 }],
					prototypeBlocks: [{ code: validPrototypeBlock, projectBlockId: 5 }],
					macroBlocks: [],
					groups: [
						{
							name: 'nested',
							entry: 'main',
							modules: [],
							constantsBlocks: [],
							functionBlocks: [],
							prototypeBlocks: [],
							macroBlocks: [{ code: validMacroBlock, projectBlockId: 6 }],
							groups: [],
						},
					],
				},
			],
		});
	});

	it('splits modules into their execution entries', () => {
		expect(
			pickProjectCompilerBlocks({
				codeBlocks: [
					{ id: 1, code: validModuleBlock, entry: 'main' },
					{ id: 2, code: ['module other', 'moduleEnd'], entry: 'test' },
				],
				groups: [],
			}).entries
		).toEqual({
			main: [{ code: validModuleBlock, projectBlockId: 1 }],
			test: [{ code: ['module other', 'moduleEnd'], projectBlockId: 2 }],
		});
	});

	it('does not infer execution entries from module directives', () => {
		expect(
			pickProjectCompilerBlocks({
				codeBlocks: [{ id: 1, code: ['module regular', 'moduleEnd'], entry: 'main' }],
				groups: [],
			}).entries
		).toEqual({
			main: [{ code: ['module regular', 'moduleEnd'], projectBlockId: 1 }],
		});
	});

	it('rejects module blocks without an entry', () => {
		expect(() => pickProjectCompilerBlocks({ codeBlocks: [{ id: 1, code: validModuleBlock }], groups: [] })).toThrow(
			'missing entry'
		);
	});

	it('rejects project blocks without numeric ids', () => {
		expect(() =>
			pickProjectCompilerBlocks({
				codeBlocks: [{ code: validFunctionBlock } as never],
				groups: [],
			})
		).toThrow('missing numeric id');
	});
});
