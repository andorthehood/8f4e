import { describe, test, expect } from 'vitest';

import compile from '../../src';

describe('inter-module references - element word size', () => {
	test('resolves element word size reference in declaration default (sizeof(module:memory))', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 10 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int wordSize sizeof(sourceModule:buffer)', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['wordSize']).toBeDefined();
		// wordSize should be set to the element word size of buffer
		expect(targetModule.memoryMap['wordSize'].default).toBe(sourceModule.memoryMap['buffer'].elementWordSize);
		expect(targetModule.memoryMap['wordSize'].default).toBe(4); // int is 4 bytes
	});

	test('resolves element word size reference for float array', () => {
		const modules = [
			{ code: ['module sourceModule', 'float[] data 7 0.0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int size sizeof(sourceModule:data)', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['size']).toBeDefined();
		// size should be set to the element word size of data
		expect(targetModule.memoryMap['size'].default).toBe(sourceModule.memoryMap['data'].elementWordSize);
		expect(targetModule.memoryMap['size'].default).toBe(4); // float is 4 bytes
	});

	test('resolves element word size reference in memory declaration default', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int elemSize sizeof(sourceModule:buffer)', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['elemSize']).toBeDefined();
		// elemSize should be set to the element word size of buffer
		expect(targetModule.memoryMap['elemSize'].default).toBe(sourceModule.memoryMap['buffer'].elementWordSize);
		expect(targetModule.memoryMap['elemSize'].default).toBe(4);
	});

	test('rejects multi-dot element word size reference', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int size sizeof(sourceModule:buffer.extra)', 'moduleEnd'] },
		];

		// Should throw because multi-dot references are rejected
		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
			});
		}).toThrow();
	});

	test('rejects multi-dot element word size reference in memory declaration default', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int size sizeof(sourceModule:buffer.extra)', 'moduleEnd'] },
		];

		// Should throw because multi-dot references are rejected in declaration defaults as well
		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
			});
		}).toThrow();
	});

	test('throws error for unknown module in element word size reference', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int size sizeof(unknownModule:buffer)', 'moduleEnd'] },
		];

		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
			});
		}).toThrow();
	});

	test('throws error for unknown memory in element word size reference', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int size sizeof(sourceModule:unknownMemory)', 'moduleEnd'] },
		];

		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
			});
		}).toThrow();
	});

	test('module dependency sorting works with element word size references', () => {
		const modules = [
			{ code: ['module dependentModule', 'int size sizeof(baseModule:buffer)', 'moduleEnd'] },
			{ code: ['module baseModule', 'int[] buffer 8 0', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
		});

		const baseModule = result.compiledModules['baseModule'];
		const dependentModule = result.compiledModules['dependentModule'];

		// Both modules should compile successfully
		expect(baseModule).toBeDefined();
		expect(dependentModule).toBeDefined();

		// Verify the reference is resolved correctly
		expect(dependentModule.memoryMap['size'].default).toBe(baseModule.memoryMap['buffer'].elementWordSize);
		expect(dependentModule.memoryMap['size'].default).toBe(4);
	});

	test('works with multiple element word size references', () => {
		const modules = [
			{ code: ['module moduleA', 'int[] bufferA 10 0', 'moduleEnd'] },
			{ code: ['module moduleB', 'float[] bufferB 5 0.0', 'moduleEnd'] },
			{
				code: ['module moduleC', 'int sizeA sizeof(moduleA:bufferA)', 'int sizeB sizeof(moduleB:bufferB)', 'moduleEnd'],
			},
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
		});

		const moduleA = result.compiledModules['moduleA'];
		const moduleB = result.compiledModules['moduleB'];
		const moduleC = result.compiledModules['moduleC'];

		expect(moduleA).toBeDefined();
		expect(moduleB).toBeDefined();
		expect(moduleC).toBeDefined();

		expect(moduleC.memoryMap['sizeA'].default).toBe(moduleA.memoryMap['bufferA'].elementWordSize);
		expect(moduleC.memoryMap['sizeA'].default).toBe(4);

		expect(moduleC.memoryMap['sizeB'].default).toBe(moduleB.memoryMap['bufferB'].elementWordSize);
		expect(moduleC.memoryMap['sizeB'].default).toBe(4);
	});

	test('resolves intermodule sizeof expressions inside compile-time multiplication', () => {
		const modules = [
			{ code: ['module sourceModule', 'int16[] buffer 12 0', 'moduleEnd'] },
			{
				code: ['module targetModule', 'int size 2*sizeof(sourceModule:buffer)', 'moduleEnd'],
			},
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
		});

		expect(result.compiledModules.targetModule.memoryMap.size.default).toBe(4);
	});

	test('combines element word size with other reference types in same module', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 12 0', 'moduleEnd'] },
			{
				code: [
					'module targetModule',
					'int* ptr &sourceModule:buffer',
					'int count count(sourceModule:buffer)',
					'int elemSize sizeof(sourceModule:buffer)',
					'moduleEnd',
				],
			},
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();

		// Verify ptr points to start address
		expect(targetModule.memoryMap['ptr'].default).toBe(sourceModule.memoryMap['buffer'].byteAddress);

		// Verify count holds element count
		expect(targetModule.memoryMap['count'].default).toBe(sourceModule.memoryMap['buffer'].wordAlignedSize);
		expect(targetModule.memoryMap['count'].default).toBe(12);

		// Verify elemSize holds element word size
		expect(targetModule.memoryMap['elemSize'].default).toBe(sourceModule.memoryMap['buffer'].elementWordSize);
		expect(targetModule.memoryMap['elemSize'].default).toBe(4);
	});

	test('works with pointer types', () => {
		const modules = [
			{ code: ['module sourceModule', 'int* ptr', 'moduleEnd'] },
			{ code: ['module targetModule', 'int size sizeof(sourceModule:ptr)', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['size']).toBeDefined();
		// Should get the element word size of the pointer type
		expect(targetModule.memoryMap['size'].default).toBe(sourceModule.memoryMap['ptr'].elementWordSize);
		expect(targetModule.memoryMap['size'].default).toBe(4); // int (pointed-to type) is 4 bytes
	});
});
