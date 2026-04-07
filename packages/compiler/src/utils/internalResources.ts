import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';

import type { CompilationContext, InternalResource } from '../types';

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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const createContext = () =>
		({
			namespace: {
				namespaces: {},
				memory: {},
				consts: {},
				moduleName: 'testModule',
			},
			locals: {},
			internalResources: {},
			internalAllocator: {
				nextByteAddress: 16,
			},
			stack: [],
			blockStack: [],
			startingByteAddress: 0,
			currentModuleNextWordOffset: 0,
			currentModuleWordAlignedSize: 0,
			byteCode: [],
			mode: 'module',
			codeBlockId: 'testBlock',
			codeBlockType: 'module',
		}) as unknown as CompilationContext;

	describe('internalResources', () => {
		it('allocates internal resources after the current allocator position', () => {
			const context = createContext();

			const resource = allocateInternalResource(context, '__hidden', 'int');

			expect(resource.byteAddress).toBe(16);
			expect(resource.wordAlignedAddress).toBe(4);
			expect(context.internalAllocator.nextByteAddress).toBe(20);
		});

		it('reuses an existing internal resource allocation for the same block-local id', () => {
			const context = createContext();

			const first = allocateInternalResource(context, '__hidden', 'float');
			const second = allocateInternalResource(context, '__hidden', 'float');

			expect(second).toBe(first);
			expect(Object.keys(context.internalResources)).toHaveLength(1);
			expect(context.internalAllocator.nextByteAddress).toBe(20);
		});
	});
}
