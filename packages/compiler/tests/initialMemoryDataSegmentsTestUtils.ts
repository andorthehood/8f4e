import { MemoryTypes } from '@8f4e/compiler-types';

import type { CompiledModule, DataStructure, InternalResource } from '@8f4e/compiler-types';

export function createMemory(
	overrides: Partial<DataStructure> & Pick<DataStructure, 'id' | 'byteAddress'>
): DataStructure {
	return {
		numberOfElements: 1,
		elementWordSize: 4,
		type: MemoryTypes.int,
		wordAlignedSize: 1,
		wordAlignedAddress: overrides.byteAddress / 4,
		default: 0,
		hasExplicitDefault: false,
		isInteger: true,
		isPointingToPointer: false,
		isUnsigned: false,
		...overrides,
	};
}

export function createInternalResource(
	overrides: Partial<InternalResource> & Pick<InternalResource, 'id' | 'byteAddress'>
): InternalResource {
	return {
		wordAlignedAddress: overrides.byteAddress / 4,
		wordAlignedSize: 1,
		elementWordSize: 4,
		default: 0,
		storageType: 'int',
		...overrides,
	};
}

export function createCompiledModule(overrides: Partial<CompiledModule>): CompiledModule {
	const byteAddress = overrides.byteAddress ?? 0;

	return {
		index: 0,
		initFunctionBody: [],
		cycleFunction: [],
		id: 'test',
		byteAddress,
		wordAlignedAddress: byteAddress / 4,
		memoryMap: {},
		wordAlignedSize: 0,
		...overrides,
	};
}

export function serializeSegments<T extends { byteAddress: number; bytes: Uint8Array }>(segments: T[]) {
	return segments.map(segment => ({
		byteAddress: segment.byteAddress,
		bytes: Array.from(segment.bytes),
	}));
}
