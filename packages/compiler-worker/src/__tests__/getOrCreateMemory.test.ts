import { describe, it, expect } from 'vitest';

import getOrCreateMemory from '../getOrCreateMemory';

describe('getOrCreateMemory', () => {
	// Helper to create a minimal CompiledModuleLookup for testing
	const createMockCompiledModules = () => ({
		module1: {
			cycleFunction: 'function loop() {}',
			initFunctionBody: 'init body',
			wordAlignedSize: 100,
			memoryMap: {},
		},
	});

	describe('memory action reporting', () => {
		it('should report "no-instance" reason when memory is created for the first time', () => {
			const compiledModules = createMockCompiledModules();
			const result = getOrCreateMemory(65536, compiledModules);

			expect(result.memoryAction).toEqual({
				action: 'recreated',
				reason: { kind: 'no-instance' },
			});
			expect(result.memoryRef).toBeInstanceOf(WebAssembly.Memory);
		});

		it('should report "memory-size-changed" reason when memory size changes', () => {
			// First call creates initial memory
			const compiledModules1 = createMockCompiledModules();
			getOrCreateMemory(65536, compiledModules1);

			// Second call with different size
			const compiledModules2 = createMockCompiledModules();
			const result = getOrCreateMemory(131072, compiledModules2, compiledModules1);

			expect(result.memoryAction).toEqual({
				action: 'recreated',
				reason: {
					kind: 'memory-size-changed',
					prevBytes: 65536,
					nextBytes: 131072,
				},
			});
		});

		it('should report "memory-structure-changed" reason when structure changes', () => {
			// First call creates initial memory
			const compiledModules1 = createMockCompiledModules();
			getOrCreateMemory(65536, compiledModules1);

			// Second call with same size but structure changed (different module count)
			const compiledModules2 = {
				...createMockCompiledModules(),
				module2: {
					cycleFunction: 'function loop2() {}',
					initFunctionBody: 'init body 2',
					wordAlignedSize: 200,
					memoryMap: {},
				},
			};
			const result = getOrCreateMemory(65536, compiledModules2, compiledModules1);

			expect(result.memoryAction).toEqual({
				action: 'recreated',
				reason: { kind: 'memory-structure-changed' },
			});
		});

		it('should report "reused" action when memory is reused', () => {
			// First call creates initial memory
			const compiledModules1 = createMockCompiledModules();
			getOrCreateMemory(65536, compiledModules1);

			// Second call with same size and no structure change
			const compiledModules2 = createMockCompiledModules();
			const result = getOrCreateMemory(65536, compiledModules2, compiledModules1);

			expect(result.memoryAction).toEqual({
				action: 'reused',
			});
		});

		it('should prioritize memory-size-changed over memory-structure-changed when both occur', () => {
			// First call creates initial memory
			const compiledModules1 = createMockCompiledModules();
			getOrCreateMemory(65536, compiledModules1);

			// Second call with both size and structure changed
			const compiledModules2 = {
				...createMockCompiledModules(),
				module2: {
					cycleFunction: 'function loop2() {}',
					initFunctionBody: 'init body 2',
					wordAlignedSize: 200,
					memoryMap: {},
				},
			};
			const result = getOrCreateMemory(131072, compiledModules2, compiledModules1);

			expect(result.memoryAction).toEqual({
				action: 'recreated',
				reason: {
					kind: 'memory-size-changed',
					prevBytes: 65536,
					nextBytes: 131072,
				},
			});
		});
	});

	describe('memory creation behavior', () => {
		it('should create shared memory with correct page count', () => {
			const memorySizeBytes = 65536 * 2; // 2 pages
			const compiledModules = createMockCompiledModules();
			const result = getOrCreateMemory(memorySizeBytes, compiledModules);

			expect(result.memoryRef).toBeInstanceOf(WebAssembly.Memory);
			expect(result.memoryRef.buffer.byteLength).toBe(memorySizeBytes);
		});

		it('should round up memory size to page boundary', () => {
			// Request slightly more than 1 page
			const memorySizeBytes = 65536 + 1;
			const compiledModules = createMockCompiledModules();
			const result = getOrCreateMemory(memorySizeBytes, compiledModules);

			// Should allocate 2 full pages
			expect(result.memoryRef.buffer.byteLength).toBe(65536 * 2);
		});
	});
});
