import { describe, expect, it } from 'vitest';

import { allocateInternalResource } from './internalResources';

import type { CompilationContext } from '@8f4e/compiler-spec';

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
		currentModuleNextAllocationUnitOffset: 0,
		currentModuleAllocationUnitCount: 0,
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
		expect(resource.allocationUnitAddress).toBe(4);
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

	it('allocates float64 internal resources using double-word storage', () => {
		const context = createContext();

		const resource = allocateInternalResource(context, '__hidden64', 'float64');

		expect(resource.elementWordSize).toBe(8);
		expect(resource.allocationUnitCount).toBe(2);
		expect(context.internalAllocator.nextByteAddress).toBe(24);
	});
});
