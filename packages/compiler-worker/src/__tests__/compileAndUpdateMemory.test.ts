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
push derived
push base
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
		expect(firstResult.initOnlyReran).toBe(true);
		expect(memoryView[addresses.base]).toBe(1);

		const secondResult = await compileAndUpdateMemory(createModules(10), compilerOptions);
		const updatedMemory = new Int32Array(secondResult.memoryRef.buffer);

		expect(secondResult.initOnlyReran).toBe(true);
		expect(updatedMemory[addresses.base]).toBe(10);
	});

	it('does not rerun init-only modules when defaults are unchanged', async () => {
		const firstResult = await compileAndUpdateMemory(createModules(3), compilerOptions);
		const addresses = getAddresses(firstResult.compiledModules);
		const memoryView = new Int32Array(firstResult.memoryRef.buffer);

		expect(firstResult.initOnlyReran).toBe(true);
		expect(memoryView[addresses.base]).toBe(3);

		memoryView[addresses.base] = 5;

		const secondResult = await compileAndUpdateMemory(createModules(3), compilerOptions);
		const secondMemory = new Int32Array(secondResult.memoryRef.buffer);

		expect(secondResult.initOnlyReran).toBe(false);
		expect(secondMemory[addresses.base]).toBe(5);
	});
});
