import { describe, it, expect, beforeEach, vi } from 'vitest';

import type compileAndUpdateMemoryType from '../compileAndUpdateMemory';

describe('automatic memory sizing', () => {
	let compileAndUpdateMemory: typeof compileAndUpdateMemoryType;

	beforeEach(async () => {
		vi.resetModules();
		({ default: compileAndUpdateMemory } = await import('../compileAndUpdateMemory'));
	});

	it('should automatically derive memory size when not provided', async () => {
		const modules = [
			{
				code: ['module test', 'int x', 'int y', 'moduleEnd'],
			},
		];

		// Compile without providing memorySizeBytes
		const result = await compileAndUpdateMemory(modules, {
			startingMemoryWordAddress: 0,
			// memorySizeBytes is intentionally omitted
		});

		// Should have successfully compiled
		expect(result.compiledModules).toBeDefined();
		expect(result.allocatedMemorySize).toBeGreaterThan(0);
		expect(result.memoryRef).toBeInstanceOf(WebAssembly.Memory);

		// Memory should be at least 1 WASM page (64 KiB) and page-aligned
		expect(result.memoryRef.buffer.byteLength).toBeGreaterThanOrEqual(65536);
		expect(result.memoryRef.buffer.byteLength % 65536).toBe(0);
	});

	it('should allocate minimum 1 page even for tiny programs', async () => {
		const modules = [
			{
				code: ['module test', 'int x', 'moduleEnd'],
			},
		];

		const result = await compileAndUpdateMemory(modules, {
			startingMemoryWordAddress: 0,
		});

		// Should allocate at least 64 KiB (1 page)
		expect(result.memoryRef.buffer.byteLength).toBe(65536);
		expect(result.allocatedMemorySize).toBeLessThan(65536); // Actual usage should be less than 1 page
		expect(result.allocatedMemorySize).toBeGreaterThan(0);
	});
});
