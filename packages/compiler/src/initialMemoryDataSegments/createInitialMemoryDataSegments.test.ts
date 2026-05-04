import { describe, expect, test } from 'vitest';

import createInitialMemoryDataSegments from './createInitialMemoryDataSegments';

import {
	createCompiledModule,
	createInternalResource,
	createMemory,
	serializeSegments,
} from '../../tests/initialMemoryDataSegmentsTestUtils';

describe('createInitialMemoryDataSegments', () => {
	test('skips implicit arrays while retaining scalar and explicit array defaults', () => {
		const compiledModules = [
			createCompiledModule({
				memoryMap: {
					scalarZero: createMemory({ id: 'scalarZero', byteAddress: 0, default: 0 }),
					implicitArray: createMemory({
						id: 'implicitArray',
						byteAddress: 4,
						numberOfElements: 4,
						wordAlignedSize: 4,
						default: {},
					}),
					explicitArray: createMemory({
						id: 'explicitArray',
						byteAddress: 20,
						numberOfElements: 3,
						wordAlignedSize: 3,
						hasExplicitDefault: true,
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

	test('retains explicit zero-filled array defaults', () => {
		const compiledModules = [
			createCompiledModule({
				memoryMap: {
					zeroArray: createMemory({
						id: 'zeroArray',
						byteAddress: 0,
						numberOfElements: 2,
						wordAlignedSize: 2,
						hasExplicitDefault: true,
						default: { 0: 0 },
					}),
				},
			}),
		];

		expect(serializeSegments(createInitialMemoryDataSegments(compiledModules))).toEqual([
			{
				byteAddress: 0,
				bytes: [0, 0, 0, 0, 0, 0, 0, 0],
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
