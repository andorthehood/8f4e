import { describe, test, expect } from 'vitest';

import { parseMacroDefinitions, expandMacros, convertExpandedLinesToCode } from '../src/utils/macroExpansion';

import type { Module } from '../src/types';

describe('parseMacroDefinitions', () => {
	test('should parse a simple macro definition', () => {
		const macros: Module[] = [
			{
				code: ['defineMacro add10', 'push 10', 'add', 'defineMacroEnd'],
			},
		];

		const macroMap = parseMacroDefinitions(macros);

		expect(macroMap.size).toBe(1);
		expect(macroMap.has('add10')).toBe(true);
		const macroDef = macroMap.get('add10');
		expect(macroDef?.name).toBe('add10');
		expect(macroDef?.body).toEqual(['push 10', 'add']);
	});

	test('should parse multiple macro definitions from separate code blocks', () => {
		const macros: Module[] = [
			{
				code: ['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'],
			},
			{
				code: ['defineMacro triple', 'push 3', 'mul', 'defineMacroEnd'],
			},
		];

		const macroMap = parseMacroDefinitions(macros);

		expect(macroMap.size).toBe(2);
		expect(macroMap.has('double')).toBe(true);
		expect(macroMap.has('triple')).toBe(true);
	});

	test('should throw error on multiple macro definitions in same code block', () => {
		const macros: Module[] = [
			{
				code: [
					'defineMacro double',
					'push 2',
					'mul',
					'defineMacroEnd',
					'defineMacro triple',
					'push 3',
					'mul',
					'defineMacroEnd',
				],
			},
		];

		expect(() => parseMacroDefinitions(macros)).toThrow(/Each code block can contain only one macro definition/);
	});

	test('should skip comments in macro definitions', () => {
		const macros: Module[] = [
			{
				code: [
					'; This is a comment',
					'defineMacro add10',
					'; Another comment',
					'push 10',
					'add',
					'; Final comment',
					'defineMacroEnd',
				],
			},
		];

		const macroMap = parseMacroDefinitions(macros);

		expect(macroMap.size).toBe(1);
		const macroDef = macroMap.get('add10');
		expect(macroDef?.body).toEqual(['push 10', 'add']);
	});

	test('should throw error on duplicate macro names', () => {
		const macros: Module[] = [
			{
				code: ['defineMacro add10', 'push 10', 'add', 'defineMacroEnd'],
			},
			{
				code: ['defineMacro add10', 'push 20', 'add', 'defineMacroEnd'],
			},
		];

		expect(() => parseMacroDefinitions(macros)).toThrow(/Duplicate macro name/);
	});

	test('should throw error on missing defineMacroEnd', () => {
		const macros: Module[] = [
			{
				code: ['defineMacro add10', 'push 10', 'add'],
			},
		];

		expect(() => parseMacroDefinitions(macros)).toThrow(/Missing defineMacroEnd/);
	});

	test('should throw error on nested macro definitions', () => {
		const macros: Module[] = [
			{
				code: [
					'defineMacro outer',
					'push 10',
					'defineMacro inner',
					'push 20',
					'defineMacroEnd',
					'add',
					'defineMacroEnd',
				],
			},
		];

		expect(() => parseMacroDefinitions(macros)).toThrow(/Nested macro definitions are not allowed/);
	});

	test('should throw error on macro calls inside macro definitions', () => {
		const macros: Module[] = [
			{
				code: ['defineMacro add20', 'macro add10', 'macro add10', 'defineMacroEnd'],
			},
		];

		expect(() => parseMacroDefinitions(macros)).toThrow(/Macro calls inside macro definitions/);
	});

	test('should throw error on defineMacroEnd without matching defineMacro', () => {
		const macros: Module[] = [
			{
				code: ['defineMacroEnd'],
			},
		];

		expect(() => parseMacroDefinitions(macros)).toThrow(/Missing defineMacroEnd/);
	});
});

describe('expandMacros', () => {
	test('should expand a simple macro call', () => {
		const macros: Module[] = [
			{
				code: ['defineMacro add10', 'push 10', 'add', 'defineMacroEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'int result 0', 'cycle', 'push 5', 'macro add10', 'store result', 'cycleEnd'],
			},
		];

		const macroMap = parseMacroDefinitions(macros);
		const expanded = expandMacros(modules[0], macroMap);

		expect(expanded.length).toBe(8);
		// Line 0: module test
		expect(expanded[0]).toEqual({ line: 'module test', callSiteLineNumber: 0 });
		// Line 1: int result 0
		expect(expanded[1]).toEqual({ line: 'int result 0', callSiteLineNumber: 1 });
		// Line 2: cycle
		expect(expanded[2]).toEqual({ line: 'cycle', callSiteLineNumber: 2 });
		// Line 3: push 5
		expect(expanded[3]).toEqual({ line: 'push 5', callSiteLineNumber: 3 });
		// Line 4: macro add10 expands to two lines, both map to line 4
		expect(expanded[4]).toEqual({ line: 'push 10', callSiteLineNumber: 4, macroId: 'add10' });
		expect(expanded[5]).toEqual({ line: 'add', callSiteLineNumber: 4, macroId: 'add10' });
		// Line 5: store result
		expect(expanded[6]).toEqual({ line: 'store result', callSiteLineNumber: 5 });
		// Line 6: cycleEnd
		expect(expanded[7]).toEqual({ line: 'cycleEnd', callSiteLineNumber: 6 });
	});

	test('should expand multiple macro calls', () => {
		const macros: Module[] = [
			{
				code: ['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'push 5', 'macro double', 'macro double'],
			},
		];

		const macroMap = parseMacroDefinitions(macros);
		const expanded = expandMacros(modules[0], macroMap);

		expect(expanded.length).toBe(6);
		// Line 0: module test
		expect(expanded[0]).toEqual({ line: 'module test', callSiteLineNumber: 0 });
		// Line 1: push 5
		expect(expanded[1]).toEqual({ line: 'push 5', callSiteLineNumber: 1 });
		// Line 2: first macro double
		expect(expanded[2]).toEqual({ line: 'push 2', callSiteLineNumber: 2, macroId: 'double' });
		expect(expanded[3]).toEqual({ line: 'mul', callSiteLineNumber: 2, macroId: 'double' });
		// Line 3: second macro double
		expect(expanded[4]).toEqual({ line: 'push 2', callSiteLineNumber: 3, macroId: 'double' });
		expect(expanded[5]).toEqual({ line: 'mul', callSiteLineNumber: 3, macroId: 'double' });
	});

	test('should throw error on undefined macro', () => {
		const macros: Module[] = [];

		const modules: Module[] = [
			{
				code: ['module test', 'macro undefined'],
			},
		];

		const macroMap = parseMacroDefinitions(macros);

		expect(() => expandMacros(modules[0], macroMap)).toThrow(/Undefined macro/);
	});

	test('should preserve comments and empty lines', () => {
		const macros: Module[] = [
			{
				code: ['defineMacro add10', 'push 10', 'add', 'defineMacroEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', '; This is a comment', 'macro add10', ''],
			},
		];

		const macroMap = parseMacroDefinitions(macros);
		const expanded = expandMacros(modules[0], macroMap);

		expect(expanded.length).toBe(5);
		expect(expanded[0]).toEqual({ line: 'module test', callSiteLineNumber: 0 });
		expect(expanded[1]).toEqual({ line: '; This is a comment', callSiteLineNumber: 1 });
		expect(expanded[2]).toEqual({ line: 'push 10', callSiteLineNumber: 2, macroId: 'add10' });
		expect(expanded[3]).toEqual({ line: 'add', callSiteLineNumber: 2, macroId: 'add10' });
		expect(expanded[4]).toEqual({ line: '', callSiteLineNumber: 3 });
	});
});

describe('convertExpandedLinesToCode', () => {
	test('should convert expanded lines to code and metadata', () => {
		const expandedLines = [
			{ line: 'module test', callSiteLineNumber: 0 },
			{ line: 'push 10', callSiteLineNumber: 1, macroId: 'add10' },
			{ line: 'add', callSiteLineNumber: 1, macroId: 'add10' },
			{ line: 'store result', callSiteLineNumber: 2 },
		];

		const result = convertExpandedLinesToCode(expandedLines);

		expect(result.code).toEqual(['module test', 'push 10', 'add', 'store result']);

		expect(result.lineMetadata).toEqual([
			{ callSiteLineNumber: 0 },
			{ callSiteLineNumber: 1, macroId: 'add10' },
			{ callSiteLineNumber: 1, macroId: 'add10' },
			{ callSiteLineNumber: 2 },
		]);
	});
});
