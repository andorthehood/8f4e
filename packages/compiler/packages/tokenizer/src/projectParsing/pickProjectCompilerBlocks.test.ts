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
			{ code: validModuleBlock, entry: 'main' },
			{ code: validFunctionBlock },
			{ code: validPrototypeBlock },
			{ code: validMacroBlock },
			{ code: validNoteBlock },
			{ code: validModuleBlock, entry: 'main', disabled: true },
		];

		expect(pickProjectCompilerBlocks({ codeBlocks: blocks, groups: [] })).toEqual({
			entries: { main: [{ code: validModuleBlock }] },
			constantsBlocks: [],
			functionBlocks: [{ code: validFunctionBlock }],
			prototypeBlocks: [{ code: validPrototypeBlock }],
			macroBlocks: [{ code: validMacroBlock }],
			groups: [],
		});
	});

	it('splits grouped blocks only into their group tree', () => {
		expect(
			pickProjectCompilerBlocks({
				codeBlocks: [{ code: ['module root', 'moduleEnd'], entry: 'main' }],
				groups: [
					{
						name: 'audio',
						entry: 'main',
						codeBlocks: [
							{ code: validModuleBlock, entry: 'main' },
							{ code: validFunctionBlock, entry: 'main' },
							{ code: ['constants', 'const int tableSize 16', 'constantsEnd'], entry: 'main' },
							{ code: validPrototypeBlock, entry: 'main' },
						],
						groups: [
							{
								name: 'nested',
								entry: 'main',
								codeBlocks: [{ code: validMacroBlock, entry: 'main' }],
								groups: [],
							},
						],
					},
				],
			})
		).toEqual({
			entries: { main: [{ code: ['module root', 'moduleEnd'] }] },
			constantsBlocks: [],
			functionBlocks: [],
			prototypeBlocks: [],
			macroBlocks: [],
			groups: [
				{
					name: 'audio',
					entry: 'main',
					modules: [{ code: validModuleBlock }],
					constantsBlocks: [{ code: ['constants', 'const int tableSize 16', 'constantsEnd'] }],
					functionBlocks: [{ code: validFunctionBlock }],
					prototypeBlocks: [{ code: validPrototypeBlock }],
					macroBlocks: [],
					groups: [
						{
							name: 'nested',
							entry: 'main',
							modules: [],
							constantsBlocks: [],
							functionBlocks: [],
							prototypeBlocks: [],
							macroBlocks: [{ code: validMacroBlock }],
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
					{ code: validModuleBlock, entry: 'main' },
					{ code: ['module other', 'moduleEnd'], entry: 'test' },
				],
				groups: [],
			}).entries
		).toEqual({
			main: [{ code: validModuleBlock }],
			test: [{ code: ['module other', 'moduleEnd'] }],
		});
	});

	it('does not infer execution entries from module directives', () => {
		expect(
			pickProjectCompilerBlocks({
				codeBlocks: [{ code: ['module regular', 'moduleEnd'], entry: 'main' }],
				groups: [],
			}).entries
		).toEqual({
			main: [{ code: ['module regular', 'moduleEnd'] }],
		});
	});

	it('rejects module blocks without an entry', () => {
		expect(() => pickProjectCompilerBlocks({ codeBlocks: [{ code: validModuleBlock }], groups: [] })).toThrow(
			'missing entry'
		);
	});
});
