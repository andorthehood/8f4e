import { Import, unsignedLEB128, encodeString } from '../typeHelpers';
import { ImportDesc } from '../section';

/**
 * Creates a memory import entry to import linear memory from the host environment.
 *
 * @param moduleName - The module to import from (e.g., 'js')
 * @param fieldName - The field name to import (e.g., 'memory')
 * @param initial - Initial memory size in 64KB pages (defaults to 1)
 * @param max - Optional maximum memory size in pages
 * @param isShared - Whether the memory is shared (for threading support)
 * @returns Byte array representing the memory import entry
 */
export function createMemoryImport(
	moduleName: string,
	fieldName: string,
	initial = 1,
	max?: number,
	isShared = false
): Import {
	let flags = 0x00;
	if (isShared) {
		flags = 0x03;
	} else if (max !== undefined) {
		flags = 0x01;
	}

	return [
		...encodeString(moduleName),
		...encodeString(fieldName),
		ImportDesc.MEMORY,
		flags,
		...unsignedLEB128(initial),
		...(max !== undefined ? unsignedLEB128(max) : []),
	];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createMemoryImport generates correct entry', () => {
		const imp = createMemoryImport('js', 'memory', 1);
		expect(imp).toContain(ImportDesc.MEMORY);
	});

	test('createMemoryImport handles shared memory', () => {
		const imp = createMemoryImport('js', 'memory', 1, 10, true);
		expect(imp).toContain(0x03);
	});
}
