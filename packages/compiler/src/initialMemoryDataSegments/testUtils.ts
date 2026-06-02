import type { CompiledModule, DataStructure, InternalResource, ModuleAST } from '@8f4e/compiler-spec';
import { ArgumentType, MemoryTypes } from '@8f4e/compiler-spec';

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
		isInteger: true,
		pointerDepth: 0,
		isUnsigned: false,
		...overrides,
	};
}

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

export function createCompiledModule(overrides: Partial<CompiledModule>): CompiledModule {
	const byteAddress = overrides.byteAddress ?? 0;
	const ast: ModuleAST = {
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
		containsShape: false,
		shapeLines: [],
		memoryDeclarationLines: [],
	};

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

export function serializeSegments<T extends { memoryIndex: number; byteAddress: number; bytes: Uint8Array }>(
	segments: T[]
) {
	return segments.map(segment => ({
		memoryIndex: segment.memoryIndex,
		byteAddress: segment.byteAddress,
		bytes: Array.from(segment.bytes),
	}));
}
