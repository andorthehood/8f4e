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
			host: {
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
		const result = compile({ groups: { main: modules }, functions: functions, macros: macros }, options);

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

		expect(() => compile({ groups: { main: modules }, functions: functions, macros: [] }, options)).toThrow(
			/Undefined macro/
		);
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
		const result = compile({ groups: { main: modules }, macros: macros }, options);

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

		expect(() => compile({ groups: { main: modules }, macros: [] }, options)).toThrow(/Undefined macro/);
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
		const result = compile({ groups: { main: modules }, functions: functions }, options);

		expect(result).toBeDefined();
		expect(result.compiledModules).toBeDefined();
		expect(result.compiledModules.test).toBeDefined();
		expect(result.compiledFunctions).toBeDefined();
		expect(result.compiledFunctions.doubleValue).toBeDefined();
	});

	test('should instantiate macro-expanded instructions the same as manual inline', async () => {
		const macros: Module[] = [
			{
				code: ['defineMacro addTen', 'push 10', 'add', 'defineMacroEnd'],
			},
		];

		const macroModules: Module[] = [
			{
				code: [
					'module test',
					'int input 7',
					'int output',
					'loop',
					'push &output',
					'push input',
					'macro addTen',
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
					'int output',
					'loop',
					'push &output',
					'push input',
					'push 10',
					'add',
					'store',
					'loopEnd',
					'moduleEnd',
				],
			},
		];

		const inlineResult = compile({ groups: { main: inlineModules } }, options);
		await expect(instantiate(inlineResult.codeBuffer)).resolves.toBeDefined();

		const macroResult = compile({ groups: { main: macroModules }, macros: macros }, options);
		await expect(instantiate(macroResult.codeBuffer)).resolves.toBeDefined();
	});
});
