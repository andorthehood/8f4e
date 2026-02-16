import { describe, test, expect } from 'vitest';

import compile from '../../src';

describe('inter-module references - element count', () => {
	test('resolves element count reference in declaration default ($module.memory)', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 10 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int size $sourceModule.buffer', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['size']).toBeDefined();
		// size should be set to the element count (wordAlignedSize) of buffer
		expect(targetModule.memoryMap['size'].default).toBe(sourceModule.memoryMap['buffer'].wordAlignedSize);
		expect(targetModule.memoryMap['size'].default).toBe(10);
	});

	test('resolves element count reference in init instruction', () => {
		const modules = [
			{ code: ['module sourceModule', 'float[] data 7 0.0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int count', 'init count $sourceModule.data', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['count']).toBeDefined();
		// count should be set to the element count (wordAlignedSize) of data
		expect(targetModule.memoryMap['count'].default).toBe(sourceModule.memoryMap['data'].wordAlignedSize);
		expect(targetModule.memoryMap['count'].default).toBe(7);
	});

	test('rejects multi-dot element count reference', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int size $sourceModule.buffer.extra', 'moduleEnd'] },
		];

		// Should throw because multi-dot references are rejected
		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
				memorySizeBytes: 65536,
			});
		}).toThrow();
	});

	test('throws error for unknown module in element count reference', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int size $unknownModule.buffer', 'moduleEnd'] },
		];

		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
				memorySizeBytes: 65536,
			});
		}).toThrow();
	});

	test('throws error for unknown memory in element count reference', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int size $sourceModule.unknownMemory', 'moduleEnd'] },
		];

		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
				memorySizeBytes: 65536,
			});
		}).toThrow();
	});

	test('module dependency sorting works with element count references', () => {
		const modules = [
			{ code: ['module dependentModule', 'int size $baseModule.buffer', 'moduleEnd'] },
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
		expect(dependentModule.memoryMap['size'].default).toBe(baseModule.memoryMap['buffer'].wordAlignedSize);
		expect(dependentModule.memoryMap['size'].default).toBe(8);
	});

	test('works with multiple element count references', () => {
		const modules = [
			{ code: ['module moduleA', 'int[] bufferA 10 0', 'moduleEnd'] },
			{ code: ['module moduleB', 'float[] bufferB 5 0.0', 'moduleEnd'] },
			{
				code: ['module moduleC', 'int sizeA $moduleA.bufferA', 'int sizeB $moduleB.bufferB', 'moduleEnd'],
			},
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const moduleA = result.compiledModules['moduleA'];
		const moduleB = result.compiledModules['moduleB'];
		const moduleC = result.compiledModules['moduleC'];

		expect(moduleA).toBeDefined();
		expect(moduleB).toBeDefined();
		expect(moduleC).toBeDefined();

		expect(moduleC.memoryMap['sizeA'].default).toBe(moduleA.memoryMap['bufferA'].wordAlignedSize);
		expect(moduleC.memoryMap['sizeA'].default).toBe(10);

		expect(moduleC.memoryMap['sizeB'].default).toBe(moduleB.memoryMap['bufferB'].wordAlignedSize);
		expect(moduleC.memoryMap['sizeB'].default).toBe(5);
	});

	test('combines element count and address references in same module', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 12 0', 'moduleEnd'] },
			{
				code: ['module targetModule', 'int* ptr &sourceModule.buffer', 'int size $sourceModule.buffer', 'moduleEnd'],
			},
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();

		// Verify ptr points to start address
		expect(targetModule.memoryMap['ptr'].default).toBe(sourceModule.memoryMap['buffer'].byteAddress);

		// Verify size holds element count
		expect(targetModule.memoryMap['size'].default).toBe(sourceModule.memoryMap['buffer'].wordAlignedSize);
		expect(targetModule.memoryMap['size'].default).toBe(12);
	});
});
