import type { CompiledModule, DataStructure, InternalResource, ValidatedModuleAST } from '@8f4e/compiler-spec';
import { ArgumentType, MemoryTypes } from '@8f4e/compiler-spec';

/**
 * Creates a memory data structure fixture for initial memory segment tests.
 *
 * @param overrides - Required identity and byte-address fields plus fixture overrides.
 * @returns A complete data structure fixture.
 */
export function createMemory(
	overrides: Partial<DataStructure> & Pick<DataStructure, 'id' | 'byteAddress'>
): DataStructure {
	return {
		numberOfElements: 1,
		elementWordSize: 4,
		type: MemoryTypes.int,
		memoryIndex: 0,
		wordAlignedSize: 1,
		wordAlignedAddress: overrides.byteAddress / 4,
		default: 0,
		hasExplicitDefault: false,
		isInherited: false,
		lineNumber: 0,
		isInteger: true,
		pointerDepth: 0,
		isUnsigned: false,
		...overrides,
	};
}

/**
 * Creates an internal resource fixture for initial memory segment tests.
 *
 * @param overrides - Required identity and byte-address fields plus fixture overrides.
 * @returns A complete internal resource fixture.
 */
export function createInternalResource(
	overrides: Partial<InternalResource> & Pick<InternalResource, 'id' | 'byteAddress'>
): InternalResource {
	return {
		memoryIndex: 0,
		wordAlignedAddress: overrides.byteAddress / 4,
		wordAlignedSize: 1,
		elementWordSize: 4,
		default: 0,
		storageType: 'int',
		...overrides,
	};
}

/**
 * Creates a compiled module fixture with a minimal validated module AST.
 *
 * @param overrides - Module fields to override on the generated fixture.
 * @returns A complete compiled module fixture.
 */
export function createCompiledModule(overrides: Partial<CompiledModule>): CompiledModule {
	const byteAddress = overrides.byteAddress ?? 0;
	const ast = {
		type: 'module',
		id: 'test',
		lines: [],
		moduleLine: {
			lineNumber: 0,
			instruction: 'module',
			arguments: [
				{
					type: ArgumentType.IDENTIFIER,
					value: 'test',
					referenceKind: 'plain',
					scope: 'local',
				},
			],
		},
		memoryDeclarationLines: [],
	} as unknown as ValidatedModuleAST;

	return {
		index: 0,
		initFunctionBody: [],
		cycleFunction: [],
		id: 'test',
		memoryIndex: 0,
		byteAddress,
		wordAlignedAddress: byteAddress / 4,
		memoryMap: {},
		wordAlignedSize: 0,
		ast,
		...overrides,
	};
}

/**
 * Converts memory data segments into plain arrays for stable test assertions.
 *
 * @param segments - Memory data segments to serialize.
 * @returns Serializable segment objects with byte arrays expanded.
 */
export function serializeSegments<T extends { memoryIndex: number; byteAddress: number; bytes: Uint8Array }>(
	segments: T[]
) {
	return segments.map(segment => ({
		memoryIndex: segment.memoryIndex,
		byteAddress: segment.byteAddress,
		bytes: Array.from(segment.bytes),
	}));
}
