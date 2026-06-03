import type { CodegenContext, CompilationContext, InternalResource } from '@8f4e/compiler-spec';
import { BASE_TYPE_METADATA, GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler-spec';

type InternalResourceType = InternalResource['storageType'];

type InternalResourceContext = CodegenContext | CompilationContext;

/**
 * Creates a stable internal resource id for compiler-generated module state.
 *
 * @param context - Compilation context used by the operation.
 * @param baseId - Stable id prefix for the internal resource.
 * @returns The resolved string value.
 */
export function getInternalResourceId(context: InternalResourceContext, baseId: string): string {
	return `${context.codeBlockId ?? context.namespace.moduleName ?? 'global'}::${baseId}`;
}

/**
 * Allocates or reuses a compiler-generated internal resource in the current context.
 *
 * @param context - Compilation context used by the operation.
 * @param baseId - Stable id prefix for the internal resource.
 * @param type - Function value type to convert.
 * @param defaultValue - default value value to use.
 * @returns The computed result.
 */
export function allocateInternalResource(
	context: InternalResourceContext,
	baseId: string,
	type: InternalResourceType,
	defaultValue = 0
): InternalResource {
	const id = getInternalResourceId(context, baseId);
	const existing = context.internalResources[id];
	if (existing) {
		return existing;
	}

	const elementWordSize = BASE_TYPE_METADATA[type].wordSize;
	const wordAlignedSize = elementWordSize / GLOBAL_ALIGNMENT_BOUNDARY;
	const byteAddress = context.internalAllocator.nextByteAddress;
	// Compiler-generated state is intentionally kept in default memory 0, even inside #region modules.
	const resource: InternalResource = {
		id,
		memoryIndex: 0,
		byteAddress,
		wordAlignedAddress: byteAddress / GLOBAL_ALIGNMENT_BOUNDARY,
		wordAlignedSize,
		elementWordSize,
		default: defaultValue,
		storageType: type,
	};

	context.internalResources[id] = resource;
	context.internalAllocator.nextByteAddress += wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY;
	return resource;
}
