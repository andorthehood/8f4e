import type {
	MemoryDefault,
	MemoryDefaults,
	MemoryLayoutPlan,
	PlannedMemoryDeclaration,
	PlannedMemoryModule,
} from '@8f4e/language-spec';
import { MemoryTypes } from '@8f4e/language-spec';

/**
 * Creates a memory data structure fixture for initial memory segment tests.
 *
 * @param overrides - Required identity and byte-address fields plus fixture overrides.
 * @returns A complete data structure fixture.
 */
export function createMemory(
	overrides: Partial<PlannedMemoryDeclaration> & Pick<PlannedMemoryDeclaration, 'id' | 'byteAddress'>
): PlannedMemoryDeclaration {
	return {
		numberOfElements: 1,
		elementWordSize: 4,
		type: MemoryTypes.int,
		memoryIndex: 0,
		wordAlignedSize: 1,
		wordAlignedAddress: overrides.byteAddress / 4,
		lineNumber: 0,
		isInteger: true,
		pointerDepth: 0,
		isUnsigned: false,
		...overrides,
	};
}

export function createMemoryDefault(
	value: MemoryDefault['value'],
	overrides: Partial<MemoryDefault> = {}
): MemoryDefault {
	return {
		value,
		hasExplicitDefault: false,
		isInherited: false,
		...overrides,
	};
}

export function createMemoryPlan(
	memory: Record<string, PlannedMemoryDeclaration>,
	overrides: Partial<PlannedMemoryModule> = {}
): MemoryLayoutPlan {
	const declarations = Object.values(memory);
	const byteAddress = overrides.byteAddress ?? 0;
	const wordAlignedSize =
		overrides.wordAlignedSize ??
		declarations.reduce(
			(max, declaration) => Math.max(max, declaration.wordAlignedAddress + declaration.wordAlignedSize),
			0
		);
	const module: PlannedMemoryModule = {
		id: overrides.id ?? 'test',
		lineNumber: overrides.lineNumber ?? 0,
		byteAddress,
		wordAlignedSize,
		memoryIndex: overrides.memoryIndex ?? 0,
		...(overrides.memoryRegionName ? { memoryRegionName: overrides.memoryRegionName } : {}),
		memory,
		declarations,
		declarationSources: overrides.declarationSources ?? [],
	};

	return {
		modules: {
			[module.id]: module,
		},
		moduleList: [module],
		nextByteAddressByMemoryIndex: {},
	};
}

export function createMemoryDefaults(defaults: Record<string, MemoryDefault>): Record<string, MemoryDefaults> {
	return {
		test: defaults,
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
