import { describe, test, expect } from 'vitest';

import compile from '../../src';

describe('inter-module references - end address', () => {
	test('resolves end-address inter-module reference (&module.memory&)', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 10 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int* ptr &sourceModule.buffer&', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['ptr']).toBeDefined();
		// ptr should point to the end address of buffer (last word-aligned address)
		// End address = byteAddress + (wordAlignedSize - 1) * 4
		const expectedEndAddress =
			sourceModule.memoryMap['buffer'].byteAddress + (sourceModule.memoryMap['buffer'].wordAlignedSize - 1) * 4;
		expect(targetModule.memoryMap['ptr'].default).toBe(expectedEndAddress);
	});

	test('end-address reference with scalar resolves to start address', () => {
		const modules = [
			{ code: ['module sourceModule', 'int scalar 42', 'moduleEnd'] },
			{ code: ['module targetModule', 'int* ptr &sourceModule.scalar&', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['ptr']).toBeDefined();
		// For scalar (wordAlignedSize === 1), end address equals start address
		// End address = byteAddress + (1 - 1) * 4 = byteAddress
		expect(targetModule.memoryMap['ptr'].default).toBe(sourceModule.memoryMap['scalar'].byteAddress);
	});

	test('resolves end-address reference in init instruction', () => {
		const modules = [
			{ code: ['module sourceModule', 'float[] buffer 5 0.0', 'moduleEnd'] },
			{ code: ['module targetModule', 'float* ptr', 'init ptr &sourceModule.buffer&', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['ptr']).toBeDefined();
		// End address = byteAddress + (wordAlignedSize - 1) * 4
		const expectedEndAddress =
			sourceModule.memoryMap['buffer'].byteAddress + (sourceModule.memoryMap['buffer'].wordAlignedSize - 1) * 4;
		expect(targetModule.memoryMap['ptr'].default).toBe(expectedEndAddress);
	});

	test('module dependency sorting works with end-address references', () => {
		const modules = [
			{ code: ['module dependentModule', 'int* ptr &baseModule.buffer&', 'moduleEnd'] },
			{ code: ['module baseModule', 'int[] buffer 8 0', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const baseModule = result.compiledModules['baseModule'];
		const dependentModule = result.compiledModules['dependentModule'];

		// Both modules should compile successfully
		expect(baseModule).toBeDefined();
		expect(dependentModule).toBeDefined();

		// Verify the reference is resolved correctly
		const expectedEndAddress =
			baseModule.memoryMap['buffer'].byteAddress + (baseModule.memoryMap['buffer'].wordAlignedSize - 1) * 4;
		expect(dependentModule.memoryMap['ptr'].default).toBe(expectedEndAddress);
	});
});
