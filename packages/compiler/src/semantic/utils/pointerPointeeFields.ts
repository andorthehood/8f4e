import type { AddressMetadata, CompilationContext, DataStructure } from '@8f4e/compiler-spec';

/**
 * Finds the memory item referenced by address metadata safe-range provenance.
 *
 * @param safeRange - Proven safe byte range attached to an address value.
 * @param context - Compilation context containing local and intermodule memory maps.
 * @returns The pointee memory item when it can be identified.
 */
function getPointeeMemoryItem(
	safeRange: NonNullable<AddressMetadata['safeRange']>,
	context: CompilationContext
): DataStructure | undefined {
	const memoryId = safeRange.memoryId;
	if (!memoryId) {
		return undefined;
	}

	if (safeRange.moduleId) {
		const namespace = context.namespace.namespaces[safeRange.moduleId];
		return namespace?.kind === 'module' ? namespace.memory?.[memoryId] : undefined;
	}

	return context.namespace.memory[memoryId];
}

/**
 * Calculates how many elements remain from an address default into its source memory item.
 *
 * @param defaultAddress - Address metadata attached to the resolved default value.
 * @param context - Compilation context containing memory maps for lookup.
 * @returns Remaining element count when the default points at a known memory start.
 */
function getPointeeElementCount(
	defaultAddress: AddressMetadata | undefined,
	context: CompilationContext
): number | undefined {
	const safeRange = defaultAddress?.safeRange;
	if (!safeRange || safeRange.source !== 'memory-start') {
		return undefined;
	}

	const memoryItem = getPointeeMemoryItem(safeRange, context);
	if (!memoryItem) {
		return undefined;
	}

	const byteOffset = Math.max(0, safeRange.byteAddress - memoryItem.byteAddress);
	const byteLength = memoryItem.numberOfElements * memoryItem.elementWordSize;
	return Math.max(0, Math.floor((byteLength - byteOffset) / memoryItem.elementWordSize));
}

/**
 * Builds pointer metadata derived from an address default.
 *
 * @param defaultAddress - Address metadata attached to the resolved default value.
 * @param context - Compilation context containing memory maps for lookup.
 * @returns Pointee memory-region and element-count fields for a pointer declaration.
 */
export function getPointerPointeeFields(
	defaultAddress: AddressMetadata | undefined,
	context: CompilationContext
): Pick<DataStructure, 'pointeeMemoryIndex' | 'pointeeMemoryRegionName' | 'pointeeElementCount'> {
	const pointeeElementCount = getPointeeElementCount(defaultAddress, context);

	return {
		pointeeMemoryIndex: defaultAddress?.memoryIndex ?? 0,
		...(defaultAddress?.memoryRegionName ? { pointeeMemoryRegionName: defaultAddress.memoryRegionName } : {}),
		...(pointeeElementCount !== undefined && pointeeElementCount !== 1 ? { pointeeElementCount } : {}),
	};
}

/**
 * Applies address-derived pointee metadata to an existing pointer memory item.
 *
 * @param memoryItem - Pointer memory item being updated.
 * @param defaultAddress - Address metadata attached to the resolved default value.
 * @param context - Compilation context containing memory maps for lookup.
 * @returns Nothing.
 */
export function applyPointerPointeeFields(
	memoryItem: DataStructure,
	defaultAddress: AddressMetadata | undefined,
	context: CompilationContext
): void {
	const pointerPointeeFields = getPointerPointeeFields(defaultAddress, context);

	memoryItem.pointeeMemoryIndex = pointerPointeeFields.pointeeMemoryIndex;
	if (pointerPointeeFields.pointeeMemoryRegionName) {
		memoryItem.pointeeMemoryRegionName = pointerPointeeFields.pointeeMemoryRegionName;
	} else {
		delete memoryItem.pointeeMemoryRegionName;
	}
	if (pointerPointeeFields.pointeeElementCount !== undefined) {
		memoryItem.pointeeElementCount = pointerPointeeFields.pointeeElementCount;
	} else {
		delete memoryItem.pointeeElementCount;
	}
}
