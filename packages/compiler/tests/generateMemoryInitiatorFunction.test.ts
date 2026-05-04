import { compileToAST } from '@8f4e/tokenizer';
import { MemoryTypes } from '@8f4e/compiler-types';
import { describe, test, expect } from 'vitest';

import modules from './__fixtures__/modules';

import { compileModules, createInitialMemoryDataSegments } from '../src';

import type { CompiledModule, DataStructure, InternalResource } from '@8f4e/compiler-types';

function createMemory(overrides: Partial<DataStructure> & Pick<DataStructure, 'id' | 'byteAddress'>): DataStructure {
	return {
		numberOfElements: 1,
		elementWordSize: 4,
		type: MemoryTypes.int,
		byteAddress: overrides.byteAddress,
		wordAlignedSize: 1,
		wordAlignedAddress: overrides.byteAddress / 4,
		default: 0,
		isInteger: true,
		id: overrides.id,
		isPointingToPointer: false,
		isUnsigned: false,
		...overrides,
	};
}

function createInternalResource(
	overrides: Partial<InternalResource> & Pick<InternalResource, 'id' | 'byteAddress'>
): InternalResource {
	return {
		id: overrides.id,
		byteAddress: overrides.byteAddress,
		wordAlignedAddress: overrides.byteAddress / 4,
		wordAlignedSize: 1,
		elementWordSize: 4,
		default: 0,
		storageType: 'int',
		...overrides,
	};
}

function createCompiledModule(overrides: Partial<CompiledModule>): CompiledModule {
	return {
		index: 0,
		initFunctionBody: [],
		cycleFunction: [],
		id: 'test',
		byteAddress: 0,
		wordAlignedAddress: 0,
		memoryMap: {},
		wordAlignedSize: 0,
		...overrides,
	};
}

function serializeSegments(segments: ReturnType<typeof createInitialMemoryDataSegments>) {
	return segments.map(segment => ({
		byteAddress: segment.byteAddress,
		bytes: Array.from(segment.bytes),
	}));
}

describe('compiler', () => {
	test('createInitialMemoryDataSegments', () => {
		const astModules = modules.map(({ code }) => compileToAST(code));
		const compiledModules = compileModules(astModules, {
			startingMemoryWordAddress: 0,
		});
		const requiredMemoryBytes = compiledModules.reduce(
			(max, module) => Math.max(max, module.byteAddress + module.wordAlignedSize * 4),
			0
		);
		expect(serializeSegments(createInitialMemoryDataSegments(compiledModules, requiredMemoryBytes))).toMatchSnapshot();
	});

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

		expect(serializeSegments(createInitialMemoryDataSegments(compiledModules, 36))).toEqual([
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

		expect(serializeSegments(createInitialMemoryDataSegments(compiledModules, 16))).toEqual([
			{
				byteAddress: 12,
				bytes: [0, 0, 0, 0],
			},
		]);
	});
});
