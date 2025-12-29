import { unsignedLEB128, createVector } from './typeHelpers';
import { Section } from './section';

/**
 * Creates a WebAssembly memory section defining linear memory size limits.
 *
 * @param pageSize - Initial memory size in 64KB pages
 * @returns Byte array representing the complete memory section
 */
export function createMemorySection(pageSize: number): number[] {
	const numberOfMemoryEntries = 1;
	const flags = 0x01;
	return [
		Section.MEMORY,
		...createVector([...unsignedLEB128(numberOfMemoryEntries), ...unsignedLEB128(flags), ...unsignedLEB128(pageSize)]),
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
