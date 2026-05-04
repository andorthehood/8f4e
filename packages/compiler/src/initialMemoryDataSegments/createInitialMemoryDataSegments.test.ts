import { describe, expect, test } from 'vitest';

import createInitialMemoryDataSegments from './createInitialMemoryDataSegments';

import {
	createCompiledModule,
	createInternalResource,
	createMemory,
	serializeSegments,
} from '../../tests/initialMemoryDataSegmentsTestUtils';

describe('createInitialMemoryDataSegments', () => {
	test('skips implicit zero defaults while retaining non-zero and explicit defaults', () => {
		const compiledModules = [
			createCompiledModule({
				memoryMap: {
					scalarZero: createMemory({ id: 'scalarZero', byteAddress: 0, default: 0 }),
					scalarValue: createMemory({ id: 'scalarValue', byteAddress: 4, default: 5 }),
					implicitArray: createMemory({
						id: 'implicitArray',
						byteAddress: 8,
						numberOfElements: 4,
						wordAlignedSize: 4,
						default: {},
					}),
					explicitArray: createMemory({
						id: 'explicitArray',
						byteAddress: 24,
						numberOfElements: 3,
						wordAlignedSize: 3,
						hasExplicitDefault: true,
						default: {
							1: 2,
						},
					}),
					explicitScalarZero: createMemory({
						id: 'explicitScalarZero',
						byteAddress: 36,
						hasExplicitDefault: true,
						default: 0,
					}),
				},
			}),
		];

		expect(serializeSegments(createInitialMemoryDataSegments(compiledModules))).toEqual([
			{
				byteAddress: 4,
				bytes: [5, 0, 0, 0, ...new Array(16).fill(0), 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
			},
		]);
	});

	test('skips explicit zero-filled array defaults', () => {
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

		expect(serializeSegments(createInitialMemoryDataSegments(compiledModules))).toEqual([]);
	});

	test('skips zero-filled internal resource defaults', () => {
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

		expect(serializeSegments(createInitialMemoryDataSegments(compiledModules))).toEqual([]);
	});

	test('retains non-zero internal resource defaults', () => {
		const compiledModules = [
			createCompiledModule({
				internalResources: {
					resource: createInternalResource({ id: 'resource', byteAddress: 12, default: 6 }),
				},
			}),
		];

		expect(serializeSegments(createInitialMemoryDataSegments(compiledModules))).toEqual([
			{
				byteAddress: 12,
				bytes: [6, 0, 0, 0],
			},
		]);
	});
});
