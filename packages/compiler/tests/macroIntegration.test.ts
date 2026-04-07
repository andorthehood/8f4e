import { describe, test, expect } from 'vitest';

import compile from '../src/index';

import type { Module } from '../src/types';

describe('Macro expansion integration', () => {
	const options = {
		startingMemoryWordAddress: 0,
		disableSharedMemory: true,
	};

	async function instantiate(codeBuffer: Uint8Array) {
		return WebAssembly.instantiate(codeBuffer, {
			js: {
				memory: new WebAssembly.Memory({ initial: 1, maximum: 1 }),
			},
		});
	}

	test('should compile functions with macro expansion', () => {
		const macros: Module[] = [
			{
				code: ['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'],
			},
		];

		const functions: Module[] = [
			{
				code: ['function doubleValue', 'param int value', 'push value', 'macro double', 'functionEnd int'],
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

		expect(() => compile(modules, options, functions, [])).toThrow(/Undefined macro/);
	});

	test('should compile modules with macro expansion', () => {
		const macros: Module[] = [
			{
				code: ['defineMacro incrementCounter', 'push 1', 'add', 'defineMacroEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'int counter 0', 'push counter', 'macro incrementCounter', 'drop', 'moduleEnd'],
			},
		];

		// Should not throw
		const result = compile(modules, options, undefined, macros);

		expect(result).toBeDefined();
		expect(result.compiledModules).toBeDefined();
		expect(result.compiledModules.test).toBeDefined();
	});

	test('should throw error on undefined macro in module', () => {
		const modules: Module[] = [
			{
				code: ['module test', 'int counter 0', 'push counter', 'macro undefined', 'drop', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, options, undefined, [])).toThrow(/Undefined macro/);
	});

	test('should compile without macros (backward compatibility)', () => {
		const functions: Module[] = [
			{
				code: ['function doubleValue', 'param int value', 'push value', 'push 2', 'mul', 'functionEnd int'],
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

		// Should not throw when no macros provided
		const result = compile(modules, options, functions);

		expect(result).toBeDefined();
		expect(result.compiledModules).toBeDefined();
		expect(result.compiledModules.test).toBeDefined();
		expect(result.compiledFunctions).toBeDefined();
		expect(result.compiledFunctions.doubleValue).toBeDefined();
	});

	test('should instantiate macro-expanded temp-local instructions the same as manual inline', async () => {
		const macros: Module[] = [
			{
				code: ['defineMacro duplicateTwice', 'dup', 'dup', 'defineMacroEnd'],
			},
		];

		const macroModules: Module[] = [
			{
				code: [
					'module test',
					'int input 7',
					'int output1',
					'int output2',
					'int output3',
					'loop',
					'push &output1',
					'push &output2',
					'push &output3',
					'push input',
					'macro duplicateTwice',
					'store',
					'store',
					'store',
					'loopEnd',
					'moduleEnd',
				],
			},
		];

		const inlineModules: Module[] = [
			{
				code: [
					'module test',
					'int input 7',
					'int output1',
					'int output2',
					'int output3',
					'loop',
					'push &output1',
					'push &output2',
					'push &output3',
					'push input',
					'dup',
					'dup',
					'store',
					'store',
					'store',
					'loopEnd',
					'moduleEnd',
				],
			},
		];

		const inlineResult = compile(inlineModules, options);
		await expect(instantiate(inlineResult.codeBuffer)).resolves.toBeDefined();

		const macroResult = compile(macroModules, options, undefined, macros);
		await expect(instantiate(macroResult.codeBuffer)).resolves.toBeDefined();
	});
});
