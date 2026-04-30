import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';

import type { CompilationContext, InternalResource } from '@8f4e/compiler-types';

type InternalResourceType = 'int' | 'float' | 'float64';

function getElementWordSize(type: InternalResourceType): number {
	return type === 'float64' ? 8 : 4;
}

function getWordAlignedSize(type: InternalResourceType): number {
	return type === 'float64' ? 2 : 1;
}

export function getInternalResourceId(context: CompilationContext, baseId: string): string {
	return `${context.codeBlockId ?? context.namespace.moduleName ?? 'global'}::${baseId}`;
}

export function allocateInternalResource(
	context: CompilationContext,
	baseId: string,
	type: InternalResourceType,
	defaultValue = 0
): InternalResource {
	const id = getInternalResourceId(context, baseId);
	const existing = context.internalResources[id];
	if (existing) {
		return existing;
	}

	const elementWordSize = getElementWordSize(type);
	const wordAlignedSize = getWordAlignedSize(type);
	const byteAddress = context.internalAllocator.nextByteAddress;
	const resource: InternalResource = {
		id,
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
