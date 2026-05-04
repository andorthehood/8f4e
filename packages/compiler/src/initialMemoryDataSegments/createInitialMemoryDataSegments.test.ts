import { describe, expect, test } from 'vitest';

import createInitialMemoryDataSegments from './createInitialMemoryDataSegments';

import {
	createCompiledModule,
	createInternalResource,
	createMemory,
	serializeSegments,
} from '../../tests/initialMemoryDataSegmentsTestUtils';

describe('createInitialMemoryDataSegments', () => {
	test('skips zero-filled arrays while retaining scalar defaults', () => {
		const compiledModules = [
			createCompiledModule({
				memoryMap: {
					scalarZero: createMemory({ id: 'scalarZero', byteAddress: 0, default: 0 }),
					zeroArray: createMemory({
						id: 'zeroArray',
						byteAddress: 4,
						numberOfElements: 4,
						wordAlignedSize: 4,
						default: {
							0: 0,
							2: 0,
						},
					}),
					nonZeroArray: createMemory({
						id: 'nonZeroArray',
						byteAddress: 20,
						numberOfElements: 3,
						wordAlignedSize: 3,
						default: {
							1: 2,
						},
					}),
					adjacentScalarZero: createMemory({ id: 'adjacentScalarZero', byteAddress: 32, default: 0 }),
				},
			}),
		];

		expect(serializeSegments(createInitialMemoryDataSegments(compiledModules))).toEqual([
			{
				byteAddress: 0,
				bytes: [0, 0, 0, 0],
			},
			{
				byteAddress: 20,
				bytes: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			},
		]);
	});

	test('retains zero-filled internal resource defaults', () => {
		const compiledModules = [
			createCompiledModule({
				memoryMap: {
					zeroArray: createMemory({
						id: 'zeroArray',
						byteAddress: 0,
						numberOfElements: 2,
						wordAlignedSize: 2,
						default: {},
					}),
				},
				internalResources: {
					resource: createInternalResource({ id: 'resource', byteAddress: 12, default: 0 }),
				},
			}),
		];

		expect(serializeSegments(createInitialMemoryDataSegments(compiledModules))).toEqual([
			{
				byteAddress: 12,
				bytes: [0, 0, 0, 0],
			},
		]);
	});
});
