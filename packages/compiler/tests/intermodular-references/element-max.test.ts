import { describe, test, expect } from 'vitest';

import compile from '../../src';

describe('inter-module references - element max', () => {
	test('resolves element max reference for signed int32 in declaration default (^module.memory)', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 10 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int maxValue ^sourceModule.buffer', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const sourceModule = result.compiledModules['sourceModule'];
		const targetModule = result.compiledModules['targetModule'];

		expect(sourceModule).toBeDefined();
		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['maxValue']).toBeDefined();
		// maxValue should be set to the element max value of buffer (signed int32)
		expect(targetModule.memoryMap['maxValue'].default).toBe(2147483647);
	});

	test('resolves element max reference for signed int32', () => {
		const modules = [
			{ code: ['module sourceModule', 'int32[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int maxValue ^sourceModule.buffer', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['maxValue']).toBeDefined();
		// maxValue should be set to the element max value (signed int32)
		expect(targetModule.memoryMap['maxValue'].default).toBe(2147483647);
	});

	test('resolves element max reference for float32', () => {
		const modules = [
			{ code: ['module sourceModule', 'float[] data 7 0.0', 'moduleEnd'] },
			{ code: ['module targetModule', 'float maxValue ^sourceModule.data', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['maxValue']).toBeDefined();
		// maxValue should be set to the max finite float32 value
		expect(targetModule.memoryMap['maxValue'].default).toBe(3.4028234663852886e38);
	});

	test('resolves element max reference for signed int16', () => {
		const modules = [
			{ code: ['module sourceModule', 'int16[] buffer 10 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int maxValue ^sourceModule.buffer', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['maxValue']).toBeDefined();
		// maxValue should be set to the element max value (signed int16)
		expect(targetModule.memoryMap['maxValue'].default).toBe(32767);
	});

	test('resolves element max reference for unsigned int16', () => {
		const modules = [
			{ code: ['module sourceModule', 'int16u[] buffer 10 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int maxValue ^sourceModule.buffer', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['maxValue']).toBeDefined();
		// maxValue should be set to the element max value (unsigned int16)
		expect(targetModule.memoryMap['maxValue'].default).toBe(65535);
	});

	test('resolves element max reference for signed int8', () => {
		const modules = [
			{ code: ['module sourceModule', 'int8[] buffer 10 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int maxValue ^sourceModule.buffer', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['maxValue']).toBeDefined();
		// maxValue should be set to the element max value (signed int8)
		expect(targetModule.memoryMap['maxValue'].default).toBe(127);
	});

	test('resolves element max reference for unsigned int8', () => {
		const modules = [
			{ code: ['module sourceModule', 'int8u[] buffer 10 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int maxValue ^sourceModule.buffer', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['maxValue']).toBeDefined();
		// maxValue should be set to the element max value (unsigned int8)
		expect(targetModule.memoryMap['maxValue'].default).toBe(255);
	});

	test('resolves element max reference in init instruction', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 10 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int maxValue', 'init maxValue ^sourceModule.buffer', 'moduleEnd'] },
		];

		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
		});

		const targetModule = result.compiledModules['targetModule'];

		expect(targetModule).toBeDefined();
		expect(targetModule.memoryMap['maxValue']).toBeDefined();
		// maxValue should be set to the element max value via init instruction
		expect(targetModule.memoryMap['maxValue'].default).toBe(2147483647);
	});

	test('rejects multi-dot element max reference', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int maxValue ^sourceModule.buffer.extra', 'moduleEnd'] },
		];

		// Should throw because multi-dot references are rejected
		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
				memorySizeBytes: 65536,
			});
		}).toThrow();
	});

	test('rejects multi-dot element max reference in init instruction', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int maxValue', 'init maxValue ^sourceModule.buffer.extra', 'moduleEnd'] },
		];

		// Should throw because multi-dot references are rejected in init as well
		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
				memorySizeBytes: 65536,
			});
		}).toThrow();
	});

	test('throws error for unknown module in element max reference', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int maxValue ^unknownModule.buffer', 'moduleEnd'] },
		];

		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
				memorySizeBytes: 65536,
			});
		}).toThrow();
	});

	test('throws error for unknown memory in element max reference', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 5 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int maxValue ^sourceModule.unknownMemory', 'moduleEnd'] },
		];

		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
				memorySizeBytes: 65536,
			});
		}).toThrow();
	});

	test('module dependency sorting works with element max references', () => {
		const modules = [
			{ code: ['module dependentModule', 'int maxValue ^baseModule.buffer', 'moduleEnd'] },
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
		expect(dependentModule.memoryMap['maxValue'].default).toBe(2147483647);
	});

	test('works with multiple element max references', () => {
		const modules = [
			{ code: ['module moduleA', 'int[] bufferA 10 0', 'moduleEnd'] },
			{ code: ['module moduleB', 'float[] bufferB 5 0.0', 'moduleEnd'] },
			{
				code: ['module moduleC', 'int maxA ^moduleA.bufferA', 'float maxB ^moduleB.bufferB', 'moduleEnd'],
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

		expect(moduleC.memoryMap['maxA'].default).toBe(2147483647);
		expect(moduleC.memoryMap['maxB'].default).toBe(3.4028234663852886e38);
	});

	test('combines element max with other inter-module references', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 12 0', 'moduleEnd'] },
			{
				code: [
					'module targetModule',
					'int* ptr &sourceModule.buffer',
					'int size $sourceModule.buffer',
					'int maxValue ^sourceModule.buffer',
					'moduleEnd',
				],
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

		// Verify maxValue holds element max
		expect(targetModule.memoryMap['maxValue'].default).toBe(2147483647);
	});
});
