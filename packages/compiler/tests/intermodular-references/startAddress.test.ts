import { describe, test, expect } from 'vitest';

import compile from '../../src';

describe('inter-module references - start address', () => {
	test('resolves start-address inter-module reference (&module.memory)', () => {
		const modules = [
			{ code: ['module sourceModule', 'int[] buffer 10 0', 'moduleEnd'] },
			{ code: ['module targetModule', 'int* ptr &sourceModule.buffer', 'moduleEnd'] },
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
		// ptr should point to the start address of buffer
		expect(targetModule.memoryMap['ptr'].default).toBe(sourceModule.memoryMap['buffer'].byteAddress);
	});

	test('resolves start-address reference in init instruction', () => {
		const modules = [
			{ code: ['module sourceModule', 'float[] buffer 5 0.0', 'moduleEnd'] },
			{ code: ['module targetModule', 'float* ptr', 'init ptr &sourceModule.buffer', 'moduleEnd'] },
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
		// Start address
		expect(targetModule.memoryMap['ptr'].default).toBe(sourceModule.memoryMap['buffer'].byteAddress);
	});

	test('rejects multi-dot inter-module reference', () => {
		const modules = [
			{ code: ['module sourceModule', 'int buffer 42', 'moduleEnd'] },
			{ code: ['module targetModule', 'int* ptr &sourceModule.buffer.extra', 'moduleEnd'] },
		];

		// Should throw because multi-dot references are now rejected
		expect(() => {
			compile(modules, {
				startingMemoryWordAddress: 0,
				memorySizeBytes: 65536,
			});
		}).toThrow();
	});

	test('module dependency sorting works with start-address references', () => {
		const modules = [
			{ code: ['module dependentModule', 'int* ptr &baseModule.buffer', 'moduleEnd'] },
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
		expect(dependentModule.memoryMap['ptr'].default).toBe(baseModule.memoryMap['buffer'].byteAddress);
	});
});
