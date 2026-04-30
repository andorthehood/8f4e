import { describe, expect, it } from 'vitest';

import { allocateInternalResource } from './internalResources';

import type { CompilationContext } from '@8f4e/compiler-types';

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
