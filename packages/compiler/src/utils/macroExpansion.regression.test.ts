import type { Module } from '@8f4e/compiler-spec';
import { describe, expect, test } from 'vitest';
import { expandMacros, parseMacroDefinitions } from './macroExpansion';

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
		expect(expanded[0]).toBe('module test');
		// Line 1: int result 0
		expect(expanded[1]).toBe('int result 0');
		// Line 2: cycle
		expect(expanded[2]).toBe('cycle');
		// Line 3: push 5
		expect(expanded[3]).toBe('push 5');
		// Line 4: macro add10 expands to two lines, both map to line 4
		expect(expanded[4]).toBe('push 10');
		expect(expanded[5]).toBe('add');
		// Line 5: store result
		expect(expanded[6]).toBe('store result');
		// Line 6: cycleEnd
		expect(expanded[7]).toBe('cycleEnd');
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
		expect(expanded[0]).toBe('module test');
		// Line 1: push 5
		expect(expanded[1]).toBe('push 5');
		// Line 2: first macro double
		expect(expanded[2]).toBe('push 2');
		expect(expanded[3]).toBe('mul');
		// Line 3: second macro double
		expect(expanded[4]).toBe('push 2');
		expect(expanded[5]).toBe('mul');
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
		expect(expanded[0]).toBe('module test');
		expect(expanded[1]).toBe('; This is a comment');
		expect(expanded[2]).toBe('push 10');
		expect(expanded[3]).toBe('add');
		expect(expanded[4]).toBe('');
	});
});
