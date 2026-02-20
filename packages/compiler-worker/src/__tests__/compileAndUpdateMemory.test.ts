import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CompiledModuleLookup, Module } from '@8f4e/compiler';
import type compileAndUpdateMemoryType from '../compileAndUpdateMemory';

describe('compileAndUpdateMemory init-only reruns', () => {
	const compilerOptions = { memorySizeBytes: 1024, startingMemoryWordAddress: 1 };
	let compileAndUpdateMemory: typeof compileAndUpdateMemoryType;

	const createModules = (baseDefault: number): Module[] => [
		{
			code: `
module setup
#initOnly
int base ${baseDefault}
int derived 0
push &derived
push &base
load
push 1
add
store
moduleEnd
`
				.trim()
				.split('\n'),
		},
	];

	const getAddresses = (compiledModules: CompiledModuleLookup) => ({
		base: compiledModules.setup.memoryMap.base.byteAddress / 4,
		derived: compiledModules.setup.memoryMap.derived.byteAddress / 4,
	});

	beforeEach(async () => {
		vi.resetModules();
		({ default: compileAndUpdateMemory } = await import('../compileAndUpdateMemory'));
	});

	it('re-runs init-only modules when memory defaults change', async () => {
		const firstResult = await compileAndUpdateMemory(createModules(1), compilerOptions);
		const addresses = getAddresses(firstResult.compiledModules);
		const memoryView = new Int32Array(firstResult.memoryRef.buffer);

		const exportKeys = Object.keys(
			(
				await WebAssembly.instantiate(firstResult.codeBuffer, {
					js: { memory: new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }) },
				})
			).instance.exports as Record<string, unknown>
		);

		expect(exportKeys).toContain('initOnly');
		expect(firstResult.compiledModules.setup.initOnlyExecution).toBe(true);
		expect(firstResult.initOnlyReran).toBe(false);
		expect(memoryView[addresses.base]).toBe(1);
		expect(memoryView[addresses.derived]).toBe(2);

		const secondResult = await compileAndUpdateMemory(createModules(10), compilerOptions);
		const updatedMemory = new Int32Array(secondResult.memoryRef.buffer);

		expect(secondResult.initOnlyReran).toBe(true);
		expect(updatedMemory[addresses.base]).toBe(10);
		expect(updatedMemory[addresses.derived]).toBe(11);
	});

	it('does not rerun init-only modules when defaults are unchanged', async () => {
		const firstResult = await compileAndUpdateMemory(createModules(3), compilerOptions);
		const addresses = getAddresses(firstResult.compiledModules);
		const memoryView = new Int32Array(firstResult.memoryRef.buffer);

		expect(firstResult.initOnlyReran).toBe(false);
		expect(memoryView[addresses.base]).toBe(3);
		expect(memoryView[addresses.derived]).toBe(4);

		memoryView[addresses.base] = 5;

		const secondResult = await compileAndUpdateMemory(createModules(3), compilerOptions);
		const secondMemory = new Int32Array(secondResult.memoryRef.buffer);

		expect(secondResult.initOnlyReran).toBe(false);
		expect(secondMemory[addresses.base]).toBe(5);
		expect(secondMemory[addresses.derived]).toBe(4);
	});
});

describe('compileAndUpdateMemory float64 incremental patching', () => {
	const compilerOptions = { memorySizeBytes: 1024, startingMemoryWordAddress: 1 };
	let compileAndUpdateMemory: typeof compileAndUpdateMemoryType;

	beforeEach(async () => {
		vi.resetModules();
		({ default: compileAndUpdateMemory } = await import('../compileAndUpdateMemory'));
	});

	it('patches float64 scalar default correctly on incremental recompile', async () => {
		const createModules = (val: number): Module[] => [
			{ code: `module mymod\nfloat64 value ${val}\nmoduleEnd`.split('\n') },
		];

		const firstResult = await compileAndUpdateMemory(createModules(1.5), compilerOptions);
		const memEntry = firstResult.compiledModules.mymod.memoryMap.value;
		const float64Index = memEntry.byteAddress / 8;
		const firstView = new Float64Array(firstResult.memoryRef.buffer);

		expect(firstView[float64Index]).toBeCloseTo(1.5);

		const secondResult = await compileAndUpdateMemory(createModules(2.5), compilerOptions);
		const secondView = new Float64Array(secondResult.memoryRef.buffer);

		expect(secondView[float64Index]).toBeCloseTo(2.5);
	});

	it('does not overwrite float64 memory when default is unchanged on incremental recompile', async () => {
		const createModules = (val: number): Module[] => [
			{ code: `module mymod\nfloat64 value ${val}\nmoduleEnd`.split('\n') },
		];

		const firstResult = await compileAndUpdateMemory(createModules(3.14), compilerOptions);
		const memEntry = firstResult.compiledModules.mymod.memoryMap.value;
		const float64Index = memEntry.byteAddress / 8;

		const firstView = new Float64Array(firstResult.memoryRef.buffer);
		expect(firstView[float64Index]).toBeCloseTo(3.14);

		// Manually overwrite the value in memory
		firstView[float64Index] = 9.99;

		const secondResult = await compileAndUpdateMemory(createModules(3.14), compilerOptions);
		const secondView = new Float64Array(secondResult.memoryRef.buffer);

		// Should NOT have been reset to 3.14 since the default didn't change
		expect(secondView[float64Index]).toBeCloseTo(9.99);
	});
});
