import { ErrorCode } from '@8f4e/compiler-spec';
import { describe, expect, test } from 'vitest';

import compile from '../src';

async function instantiateWithRegions(result: ReturnType<typeof compile>, regionNames: string[]) {
	const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
	const regionMemories = Object.fromEntries(
		regionNames.map(regionName => [regionName, new WebAssembly.Memory({ initial: 1, maximum: 1 })])
	);
	const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
		js: {
			memory,
			...regionMemories,
		},
	});

	return {
		instance,
		memory,
		regionMemories,
		defaultView: new DataView(memory.buffer),
		regionViews: Object.fromEntries(
			Object.entries(regionMemories).map(([regionName, regionMemory]) => [
				regionName,
				new DataView(regionMemory.buffer),
			])
		),
	};
}

describe('logical memory regions', () => {
	test('allocates #region declarations in the configured memory and dereferences pointers through provenance', async () => {
		const result = compile(
			[
				{
					code: ['module samples', '#region sampleMemory', 'int8[] values 4 11', 'moduleEnd'],
				},
				{
					code: [
						'module reader',
						'int result',
						'int8* ptr &samples:values',
						'push &result',
						'push *ptr',
						'store',
						'moduleEnd',
					],
				},
			],
			{ disableSharedMemory: true, memoryRegions: ['sampleMemory'] }
		);
		const { instance, defaultView, regionViews } = await instantiateWithRegions(result, ['sampleMemory']);

		(instance.exports.init as CallableFunction)();
		(instance.exports.cycle as CallableFunction)();

		const values = result.compiledModules.samples.memoryMap.values;
		const resultMemory = result.compiledModules.reader.memoryMap.result;

		expect(values.memoryIndex).toBe(1);
		expect(values.memoryRegionName).toBe('sampleMemory');
		expect(regionViews.sampleMemory.getInt8(values.byteAddress)).toBe(11);
		expect(defaultView.getInt32(resultMemory.byteAddress, true)).toBe(11);
		expect(result.requiredMemoryBytesByRegion).toEqual({ sampleMemory: 8 });
	});

	test('supports numeric #region indices and #region 0 default memory', () => {
		const result = compile(
			[
				{ code: ['module defaulted', '#region 0', 'int value', 'moduleEnd'] },
				{ code: ['module display', '#region 1', 'int pixel', 'moduleEnd'] },
			],
			{ disableSharedMemory: true, memoryRegions: ['displayMemory'] }
		);

		expect(result.compiledModules.defaulted.memoryIndex).toBeUndefined();
		expect(result.compiledModules.defaulted.memoryMap.value.memoryIndex).toBeUndefined();
		expect(result.compiledModules.display.memoryIndex).toBe(1);
		expect(result.compiledModules.display.memoryRegionName).toBe('displayMemory');
		expect(result.compiledModules.display.memoryMap.pixel.memoryIndex).toBe(1);
	});

	test('raw addresses still target default memory', async () => {
		const result = compile(
			[
				{
					code: ['module samples', '#region sampleMemory', 'int source 99', 'moduleEnd'],
				},
				{
					code: [
						'module defaults',
						'int source 42',
						'int result',
						'push &result',
						'push 4',
						'load',
						'store',
						'moduleEnd',
					],
				},
			],
			{ disableSharedMemory: true, memoryRegions: ['sampleMemory'] }
		);
		const { instance, defaultView } = await instantiateWithRegions(result, ['sampleMemory']);

		(instance.exports.init as CallableFunction)();
		(instance.exports.cycle as CallableFunction)();

		const resultMemory = result.compiledModules.defaults.memoryMap.result;
		expect(defaultView.getInt32(resultMemory.byteAddress, true)).toBe(42);
	});

	test('infers destination and source memories for cross-region memoryCopy', async () => {
		const result = compile(
			[
				{
					code: ['module samples', '#region sampleMemory', 'int8[] values 4 1 2 3 4', 'moduleEnd'],
				},
				{
					code: ['module defaults', 'int8[] copy 4', 'push &copy', 'push &samples:values', 'memoryCopy 4', 'moduleEnd'],
				},
			],
			{ disableSharedMemory: true, memoryRegions: ['sampleMemory'] }
		);
		const { instance, memory } = await instantiateWithRegions(result, ['sampleMemory']);

		(instance.exports.init as CallableFunction)();
		(instance.exports.cycle as CallableFunction)();

		const copy = result.compiledModules.defaults.memoryMap.copy;
		expect([...new Uint8Array(memory.buffer).slice(copy.byteAddress, copy.byteAddress + 4)]).toEqual([1, 2, 3, 4]);
	});

	test('rejects invalid region configuration and directive references', () => {
		expect(() =>
			compile([{ code: ['module test', 'moduleEnd'] }], {
				disableSharedMemory: true,
				memoryRegions: ['default'],
			})
		).toThrow(expect.objectContaining({ code: ErrorCode.INVALID_MEMORY_REGION_NAME }));

		expect(() =>
			compile([{ code: ['module test', 'moduleEnd'] }], {
				disableSharedMemory: true,
				memoryRegions: ['sampleMemory', 'sampleMemory'],
			})
		).toThrow(expect.objectContaining({ code: ErrorCode.DUPLICATE_MEMORY_REGION_NAME }));

		expect(() =>
			compile([{ code: ['module test', 'moduleEnd'] }], {
				disableSharedMemory: true,
				memoryRegions: ['memory'],
			})
		).toThrow(expect.objectContaining({ code: ErrorCode.INVALID_MEMORY_REGION_NAME }));

		expect(() =>
			compile([{ code: ['module test', 'moduleEnd'] }], {
				disableSharedMemory: true,
				memoryRegions: ['1'],
			})
		).toThrow(expect.objectContaining({ code: ErrorCode.INVALID_MEMORY_REGION_NAME }));

		expect(() =>
			compile([{ code: ['module test', '#region missingMemory', 'moduleEnd'] }], {
				disableSharedMemory: true,
				memoryRegions: ['sampleMemory'],
			})
		).toThrow(expect.objectContaining({ code: ErrorCode.UNKNOWN_MEMORY_REGION }));

		expect(() =>
			compile([{ code: ['module test', '#region 2', 'moduleEnd'] }], {
				disableSharedMemory: true,
				memoryRegions: ['sampleMemory'],
			})
		).toThrow(expect.objectContaining({ code: ErrorCode.MEMORY_REGION_INDEX_OUT_OF_BOUNDS }));
	});
});
