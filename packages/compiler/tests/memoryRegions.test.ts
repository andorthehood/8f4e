import { ErrorCode, GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';
import { describe, expect, test } from 'vitest';

import compile from '../src';

async function instantiateWithRegions(result: ReturnType<typeof compile>, regionNames: string[]) {
	const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
	const regionMemories = Object.fromEntries(
		regionNames.map(regionName => [regionName, new WebAssembly.Memory({ initial: 1, maximum: 1 })])
	);
	const { instance } = await WebAssembly.instantiate(result.codeBuffer, {
		host: {
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
			{
				entries: {
					main: [
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
				},
			},
			{ disableSharedMemory: true, memoryRegions: ['sampleMemory'] }
		);
		const { instance, defaultView, regionViews } = await instantiateWithRegions(result, ['sampleMemory']);

		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.main as CallableFunction)();

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
			{
				entries: {
					main: [
						{ code: ['module defaulted', '#region 0', 'int value', 'moduleEnd'] },
						{ code: ['module display', '#region 1', 'int pixel', 'moduleEnd'] },
					],
				},
			},
			{ disableSharedMemory: true, memoryRegions: ['displayMemory'] }
		);

		expect(result.compiledModules.defaulted.memoryIndex).toBe(0);
		expect(result.compiledModules.defaulted.memoryMap.value.memoryIndex).toBe(0);
		expect(result.compiledModules.display.memoryIndex).toBe(1);
		expect(result.compiledModules.display.memoryRegionName).toBe('displayMemory');
		expect(result.compiledModules.display.memoryMap.pixel.memoryIndex).toBe(1);
	});

	test('raw addresses still target default memory', async () => {
		const result = compile(
			{
				entries: {
					main: [
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
				},
			},
			{ disableSharedMemory: true, memoryRegions: ['sampleMemory'] }
		);
		const { instance, defaultView } = await instantiateWithRegions(result, ['sampleMemory']);

		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.main as CallableFunction)();

		const resultMemory = result.compiledModules.defaults.memoryMap.result;
		expect(defaultView.getInt32(resultMemory.byteAddress, true)).toBe(42);
	});

	test('keeps compiler-generated internal resources in default memory', () => {
		const result = compile(
			{
				entries: {
					main: [
						{
							code: [
								'module signal',
								'#region sampleMemory',
								'int input',
								'int output',
								'push &output',
								'push input',
								'hasChanged',
								'if',
								'push 1',
								'else',
								'push 0',
								'ifEnd int',
								'store',
								'moduleEnd',
							],
						},
					],
				},
			},
			{ disableSharedMemory: true, memoryRegions: ['sampleMemory'] }
		);

		const signalModule = result.compiledModules.signal;
		const resources = Object.values(signalModule.internalResources ?? {});
		const declarationBytes = Math.max(
			...Object.values(signalModule.memoryMap).map(
				data => data.byteAddress + data.wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY
			)
		);

		expect(resources).toHaveLength(1);
		expect(resources[0].memoryIndex).toBe(0);
		expect(resources[0].memoryRegionName).toBeUndefined();
		expect(result.requiredMemoryBytes).toBeGreaterThanOrEqual(
			resources[0].byteAddress + resources[0].wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY
		);
		expect(result.requiredMemoryBytesByRegion).toEqual({ sampleMemory: declarationBytes });
	});

	test('infers destination and source memories for cross-region memoryCopy', async () => {
		const result = compile(
			{
				entries: {
					main: [
						{
							code: ['module samples', '#region sampleMemory', 'int8[] values 4 1 2 3 4', 'moduleEnd'],
						},
						{
							code: [
								'module defaults',
								'int8[] copy 4',
								'push &copy',
								'push &samples:values',
								'memoryCopy 4',
								'moduleEnd',
							],
						},
					],
				},
			},
			{ disableSharedMemory: true, memoryRegions: ['sampleMemory'] }
		);
		const { instance, memory } = await instantiateWithRegions(result, ['sampleMemory']);

		(instance.exports.initDefaults as CallableFunction)();
		(instance.exports.main as CallableFunction)();

		const copy = result.compiledModules.defaults.memoryMap.copy;
		expect([...new Uint8Array(memory.buffer).slice(copy.byteAddress, copy.byteAddress + 4)]).toEqual([1, 2, 3, 4]);
	});

	test('rejects invalid region configuration and directive references', () => {
		expect(() =>
			compile(
				{ entries: { main: [{ code: ['module test', 'moduleEnd'] }] } },
				{
					disableSharedMemory: true,
					memoryRegions: ['default'],
				}
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.INVALID_MEMORY_REGION_NAME }));

		expect(() =>
			compile(
				{ entries: { main: [{ code: ['module test', 'moduleEnd'] }] } },
				{
					disableSharedMemory: true,
					memoryRegions: ['sampleMemory', 'sampleMemory'],
				}
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.DUPLICATE_MEMORY_REGION_NAME }));

		expect(() =>
			compile(
				{ entries: { main: [{ code: ['module test', 'moduleEnd'] }] } },
				{
					disableSharedMemory: true,
					memoryRegions: ['memory'],
				}
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.INVALID_MEMORY_REGION_NAME }));

		expect(() =>
			compile(
				{ entries: { main: [{ code: ['module test', 'moduleEnd'] }] } },
				{
					disableSharedMemory: true,
					memoryRegions: ['1'],
				}
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.INVALID_MEMORY_REGION_NAME }));

		expect(() =>
			compile(
				{ entries: { main: [{ code: ['module test', '#region missingMemory', 'moduleEnd'] }] } },
				{
					disableSharedMemory: true,
					memoryRegions: ['sampleMemory'],
				}
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.UNKNOWN_MEMORY_REGION }));

		expect(() =>
			compile(
				{ entries: { main: [{ code: ['module test', '#region 2', 'moduleEnd'] }] } },
				{
					disableSharedMemory: true,
					memoryRegions: ['sampleMemory'],
				}
			)
		).toThrow(expect.objectContaining({ code: ErrorCode.MEMORY_REGION_INDEX_OUT_OF_BOUNDS }));
	});
});
