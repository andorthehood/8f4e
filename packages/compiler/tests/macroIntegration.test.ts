import { describe, test, expect } from 'vitest';

import compile from '../src/index';

import type { Module } from '../src/types';

describe('Macro expansion integration', () => {
	test('should compile functions with macro expansion', () => {
		const macros: Module[] = [
			{
				code: ['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'],
			},
		];

		const functions: Module[] = [
			{
				code: ['function doubleValue', 'param int value', 'localGet value', 'macro double', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: [
					'module test',
					'int input 5',
					'int result',
					'loop',
					'push &result',
					'push input',
					'call doubleValue',
					'store',
					'loopEnd',
					'moduleEnd',
				],
			},
		];

		const options = {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 1024,
		};

		// Should not throw
		const result = compile(modules, options, functions, macros);

		expect(result).toBeDefined();
		expect(result.compiledFunctions).toBeDefined();
		expect(result.compiledFunctions.doubleValue).toBeDefined();
	});

	test('should throw error on undefined macro', () => {
		const functions: Module[] = [
			{
				code: ['function test', 'push 5', 'macro undefined', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'int result', 'moduleEnd'],
			},
		];

		const options = {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 1024,
		};

		expect(() => compile(modules, options, functions, [])).toThrow(/Undefined macro 'undefined'/);
	});

	test('should compile without macros (backward compatibility)', () => {
		const functions: Module[] = [
			{
				code: ['function doubleValue', 'param int value', 'localGet value', 'push 2', 'mul', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: [
					'module test',
					'int input 5',
					'int result',
					'loop',
					'push &result',
					'push input',
					'call doubleValue',
					'store',
					'loopEnd',
					'moduleEnd',
				],
			},
		];

		const options = {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 1024,
		};

		// Should not throw when no macros provided
		const result = compile(modules, options, functions);

		expect(result).toBeDefined();
		expect(result.compiledModules).toBeDefined();
		expect(result.compiledModules.test).toBeDefined();
		expect(result.compiledFunctions).toBeDefined();
		expect(result.compiledFunctions.doubleValue).toBeDefined();
	});
});
