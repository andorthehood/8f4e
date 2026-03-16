import WASM_MEMORY_PAGE_SIZE from './consts';

/**
 * Derives the effective memory size from a required memory footprint.
 * Rounds up to the nearest WebAssembly page boundary (64 KiB) with a minimum of one page.
 *
 * @param requiredBytes - The required memory footprint in bytes
 * @returns The effective memory size in bytes (page-aligned, minimum 1 page)
 */
export function deriveEffectiveMemorySize(requiredBytes: number): number {
	const pages = Math.ceil(requiredBytes / WASM_MEMORY_PAGE_SIZE);
	const effectivePages = Math.max(1, pages);
	return effectivePages * WASM_MEMORY_PAGE_SIZE;
}

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe('deriveEffectiveMemorySize', () => {
		test('returns minimum 1 page for zero bytes', () => {
			expect(deriveEffectiveMemorySize(0)).toBe(WASM_MEMORY_PAGE_SIZE);
		});

		test('returns minimum 1 page for small requirements', () => {
			expect(deriveEffectiveMemorySize(1)).toBe(WASM_MEMORY_PAGE_SIZE);
			expect(deriveEffectiveMemorySize(100)).toBe(WASM_MEMORY_PAGE_SIZE);
			expect(deriveEffectiveMemorySize(WASM_MEMORY_PAGE_SIZE - 1)).toBe(WASM_MEMORY_PAGE_SIZE);
		});

		test('returns exact page when requirement is exactly 1 page', () => {
			expect(deriveEffectiveMemorySize(WASM_MEMORY_PAGE_SIZE)).toBe(WASM_MEMORY_PAGE_SIZE);
		});

		test('rounds up to 2 pages when requirement exceeds 1 page', () => {
			expect(deriveEffectiveMemorySize(WASM_MEMORY_PAGE_SIZE + 1)).toBe(WASM_MEMORY_PAGE_SIZE * 2);
			expect(deriveEffectiveMemorySize(WASM_MEMORY_PAGE_SIZE * 1.5)).toBe(WASM_MEMORY_PAGE_SIZE * 2);
		});

		test('returns exact 2 pages when requirement is exactly 2 pages', () => {
			expect(deriveEffectiveMemorySize(WASM_MEMORY_PAGE_SIZE * 2)).toBe(WASM_MEMORY_PAGE_SIZE * 2);
		});

		test('rounds up correctly for arbitrary requirements', () => {
			expect(deriveEffectiveMemorySize(WASM_MEMORY_PAGE_SIZE * 2 + 1)).toBe(WASM_MEMORY_PAGE_SIZE * 3);
			expect(deriveEffectiveMemorySize(WASM_MEMORY_PAGE_SIZE * 10)).toBe(WASM_MEMORY_PAGE_SIZE * 10);
			expect(deriveEffectiveMemorySize(WASM_MEMORY_PAGE_SIZE * 10 + 1)).toBe(WASM_MEMORY_PAGE_SIZE * 11);
		});

		test('handles typical memory footprints', () => {
			expect(deriveEffectiveMemorySize(1024)).toBe(WASM_MEMORY_PAGE_SIZE);
			expect(deriveEffectiveMemorySize(102400)).toBe(WASM_MEMORY_PAGE_SIZE * 2);
			expect(deriveEffectiveMemorySize(1048576)).toBe(WASM_MEMORY_PAGE_SIZE * 16);
		});
	});
}
