import type { CompiledModuleLookup, CompileInput, Module } from '@8f4e/compiler-spec';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type compileAndUpdateMemoryType from '../compileAndUpdateMemory';

describe('compileAndUpdateMemory execution entries', () => {
	const compilerOptions = { startingMemoryWordAddress: 1 };
	let compileAndUpdateMemory: typeof compileAndUpdateMemoryType;

	const createModules = (baseDefault: number): Module[] => [
		{
			code: `
module setup
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
	const createInput = (modules: Module[]): CompileInput => ({
		entries: { init: modules },
		constants: [],
		functions: [],
		prototypes: [],
	});

	const getAddresses = (compiledModules: CompiledModuleLookup) => ({
		base: compiledModules.setup.memoryMap.base.byteAddress / 4,
		derived: compiledModules.setup.memoryMap.derived.byteAddress / 4,
	});

	beforeEach(async () => {
		vi.resetModules();
		({ default: compileAndUpdateMemory } = await import('../compileAndUpdateMemory'));
	});

	it('initializes defaults without running execution entries', async () => {
		const firstResult = await compileAndUpdateMemory(createInput(createModules(1)), compilerOptions);
		const addresses = getAddresses(firstResult.compiledModules);
		const memoryView = new Int32Array(firstResult.memoryRef.buffer);

		const exportKeys = Object.keys(
			(
				await WebAssembly.instantiate(firstResult.codeBuffer, {
					host: { memory: new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }) },
				})
			).instance.exports as Record<string, unknown>
		);

		expect(exportKeys).toContain('init');
		expect(firstResult.compiledModules.setup.executionEntryName).toBe('init');
		expect(firstResult.initOnlyReran).toBe(false);
		expect(firstResult.astCacheStats).toEqual({ hits: 0, misses: 1 });
		expect(memoryView[addresses.base]).toBe(1);
		expect(memoryView[addresses.derived]).toBe(0);

		const secondResult = await compileAndUpdateMemory(createInput(createModules(10)), compilerOptions);
		const updatedMemory = new Int32Array(secondResult.memoryRef.buffer);

		expect(secondResult.initOnlyReran).toBe(false);
		expect(secondResult.astCacheStats).toEqual({ hits: 0, misses: 2 });
		expect(updatedMemory[addresses.base]).toBe(10);
		expect(updatedMemory[addresses.derived]).toBe(0);
	});

	it('does not run execution entries when defaults are unchanged', async () => {
		const firstResult = await compileAndUpdateMemory(createInput(createModules(3)), compilerOptions);
		const addresses = getAddresses(firstResult.compiledModules);
		const memoryView = new Int32Array(firstResult.memoryRef.buffer);

		expect(firstResult.initOnlyReran).toBe(false);
		expect(memoryView[addresses.base]).toBe(3);
		expect(memoryView[addresses.derived]).toBe(0);

		memoryView[addresses.base] = 5;

		const secondResult = await compileAndUpdateMemory(createInput(createModules(3)), compilerOptions);
		const secondMemory = new Int32Array(secondResult.memoryRef.buffer);

		expect(secondResult.initOnlyReran).toBe(false);
		expect(secondResult.astCacheStats).toEqual({ hits: 1, misses: 1 });
		expect(secondMemory[addresses.base]).toBe(5);
		expect(secondMemory[addresses.derived]).toBe(0);
	});
});

describe('compileAndUpdateMemory float64 incremental patching', () => {
	const compilerOptions = { startingMemoryWordAddress: 1 };
	let compileAndUpdateMemory: typeof compileAndUpdateMemoryType;
	const createInput = (modules: Module[]): CompileInput => ({
		entries: { main: modules },
		constants: [],
		functions: [],
		prototypes: [],
	});

	beforeEach(async () => {
		vi.resetModules();
		({ default: compileAndUpdateMemory } = await import('../compileAndUpdateMemory'));
	});

	it('patches float64 scalar default correctly on incremental recompile', async () => {
		const createModules = (val: number): Module[] => [
			{ code: `module mymod\nfloat64 value ${val}\nmoduleEnd`.split('\n') },
		];

		const firstResult = await compileAndUpdateMemory(createInput(createModules(1.5)), compilerOptions);
		const memEntry = firstResult.compiledModules.mymod.memoryMap.value;
		const float64Index = memEntry.byteAddress / 8;
		const firstView = new Float64Array(firstResult.memoryRef.buffer);

		expect(firstView[float64Index]).toBeCloseTo(1.5);

		const secondResult = await compileAndUpdateMemory(createInput(createModules(2.5)), compilerOptions);
		const secondView = new Float64Array(secondResult.memoryRef.buffer);

		expect(secondView[float64Index]).toBeCloseTo(2.5);
	});

	it('does not overwrite float64 memory when default is unchanged on incremental recompile', async () => {
		const createModules = (val: number): Module[] => [
			{ code: `module mymod\nfloat64 value ${val}\nmoduleEnd`.split('\n') },
		];

		const firstResult = await compileAndUpdateMemory(createInput(createModules(3.14)), compilerOptions);
		const memEntry = firstResult.compiledModules.mymod.memoryMap.value;
		const float64Index = memEntry.byteAddress / 8;

		const firstView = new Float64Array(firstResult.memoryRef.buffer);
		expect(firstView[float64Index]).toBeCloseTo(3.14);

		// Manually overwrite the value in memory
		firstView[float64Index] = 9.99;

		const secondResult = await compileAndUpdateMemory(createInput(createModules(3.14)), compilerOptions);
		const secondView = new Float64Array(secondResult.memoryRef.buffer);

		// Should NOT have been reset to 3.14 since the default didn't change
		expect(secondView[float64Index]).toBeCloseTo(9.99);
	});
});
