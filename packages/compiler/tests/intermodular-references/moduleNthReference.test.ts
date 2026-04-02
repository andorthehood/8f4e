import { describe, test, expect } from 'vitest';

import compile from '../../src';

describe('inter-module references - module nth-item address (&module:N)', () => {
	test('&module:0 resolves to the byte address of the first memory item', () => {
		const modules = [
			{ code: ['module sourceModule', 'int a 0', 'int b 0', 'int c 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int* ptr &sourceModule:0', 'moduleEnd'] },
		];

		const result = compile(modules, { startingMemoryWordAddress: 0 });

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule.memoryMap['ptr'].default).toBe(sourceModule.memoryMap['a'].byteAddress);
	});

	test('&module:0 matches &module: (module base address)', () => {
		const modules = [
			{ code: ['module sourceModule', 'int a 0', 'int b 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int* ptrNth &sourceModule:0', 'int* ptrBase &sourceModule:', 'moduleEnd'] },
		];

		const result = compile(modules, { startingMemoryWordAddress: 0 });

		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule.memoryMap['ptrNth'].default).toBe(targetModule.memoryMap['ptrBase'].default);
	});

	test('&module:1 resolves to the byte address of the second memory item', () => {
		const modules = [
			{ code: ['module sourceModule', 'int a 0', 'int b 0', 'int c 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int* ptr &sourceModule:1', 'moduleEnd'] },
		];

		const result = compile(modules, { startingMemoryWordAddress: 0 });

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule.memoryMap['ptr'].default).toBe(sourceModule.memoryMap['b'].byteAddress);
	});

	test('&module:2 resolves to the byte address of the third memory item', () => {
		const modules = [
			{ code: ['module sourceModule', 'int a 0', 'int b 0', 'int c 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int* ptr &sourceModule:2', 'moduleEnd'] },
		];

		const result = compile(modules, { startingMemoryWordAddress: 0 });

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule.memoryMap['ptr'].default).toBe(sourceModule.memoryMap['c'].byteAddress);
	});

	test('works with non-zero startingMemoryWordAddress', () => {
		const modules = [
			{ code: ['module sourceModule', 'int a 0', 'int b 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int* ptr &sourceModule:1', 'moduleEnd'] },
		];

		const result = compile(modules, { startingMemoryWordAddress: 10 });

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule.memoryMap['ptr'].default).toBe(sourceModule.memoryMap['b'].byteAddress);
	});

	test('works with arrays - nth index skips over array items as a single slot', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 10 0', 'int scalar 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int* ptr &sourceModule:1', 'moduleEnd'] },
		];

		const result = compile(modules, { startingMemoryWordAddress: 0 });

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule.memoryMap['ptr'].default).toBe(sourceModule.memoryMap['scalar'].byteAddress);
	});

	test('dependency ordering: source module defined after target module', () => {
		const modules = [
			{ code: ['module targetModule', 'int* ptr &sourceModule:1', 'moduleEnd'] },
			{ code: ['module sourceModule', 'int a 0', 'int b 0', 'moduleEnd'] },
		];

		const result = compile(modules, { startingMemoryWordAddress: 0 });

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule.memoryMap['ptr'].default).toBe(sourceModule.memoryMap['b'].byteAddress);
	});
});
