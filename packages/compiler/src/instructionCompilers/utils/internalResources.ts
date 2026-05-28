import { BASE_TYPE_METADATA, ALLOCATION_UNIT_BYTE_SIZE } from '@8f4e/compiler-spec';

import type { CodegenContext, CompilationContext, InternalResource } from '@8f4e/compiler-spec';

type InternalResourceType = InternalResource['storageType'];

type InternalResourceContext = CodegenContext | CompilationContext;

export function getInternalResourceId(context: InternalResourceContext, baseId: string): string {
	return `${context.codeBlockId ?? context.namespace.moduleName ?? 'global'}::${baseId}`;
}

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
	const allocationUnitCount = elementWordSize / ALLOCATION_UNIT_BYTE_SIZE;
	const byteAddress = context.internalAllocator.nextByteAddress;
	// Compiler-generated state is intentionally kept in default memory 0, even inside #region modules.
	const resource: InternalResource = {
		id,
		memoryIndex: 0,
		byteAddress,
		allocationUnitAddress: byteAddress / ALLOCATION_UNIT_BYTE_SIZE,
		allocationUnitCount,
		elementWordSize,
		default: defaultValue,
		storageType: type,
	};

	context.internalResources[id] = resource;
	context.internalAllocator.nextByteAddress += allocationUnitCount * ALLOCATION_UNIT_BYTE_SIZE;
	return resource;
}
