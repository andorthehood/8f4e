import { unsignedLEB128, createVector } from '../typeHelpers';
import { Section } from '../section';

/**
 * Creates a WebAssembly memory section defining linear memory size limits.
 *
 * @param pageSize - Initial memory size in 64KB pages
 * @param maxPageSize - Optional maximum memory size in 64KB pages
 * @returns Byte array representing the complete memory section
 */
export function createMemorySection(pageSize: number, maxPageSize?: number): number[] {
	const numberOfMemoryEntries = 1;
	const flags = maxPageSize !== undefined ? 0x01 : 0x00;
	return [
		Section.MEMORY,
		...createVector([
			...unsignedLEB128(numberOfMemoryEntries),
			...unsignedLEB128(flags),
			...unsignedLEB128(pageSize),
			...(maxPageSize !== undefined ? unsignedLEB128(maxPageSize) : []),
		]),
	];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createMemorySection generates correct section', () => {
		const section = createMemorySection(1);
		expect(section[0]).toBe(Section.MEMORY);
		expect(section).toContain(1);
	});

	test('createMemorySection handles larger page sizes', () => {
		const section = createMemorySection(16);
		expect(section[0]).toBe(Section.MEMORY);
	});
}
