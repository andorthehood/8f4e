import { ErrorCode, GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';
import { describe, expect, test } from 'vitest';

import compile from '../src';

describe('logical memory regions', () => {
	test('allocates #region declarations in the configured memory', () => {
		const result = compile(
			{
				entries: {
					main: [
						{
							code: ['module samples', '#region sampleMemory', 'int8[] values 4 11', 'moduleEnd'],
						},
					],
				},
			},
			{ disableSharedMemory: true, memoryRegions: ['sampleMemory'] }
		);

		const values = result.compiledModules.samples.memoryMap.values;

		expect(values.memoryIndex).toBe(1);
		expect(values.memoryRegionName).toBe('sampleMemory');
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
