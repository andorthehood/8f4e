import { createMemoryImport } from './createMemoryImport';

import { Import, unsignedLEB128, createVector } from '../typeHelpers';
import { Section } from '../section';

/**
 * Creates a WebAssembly import section containing import declarations.
 *
 * @param imports - Array of import entries
 * @returns Byte array representing the complete import section
 */
export function createImportSection(imports: Import[]): number[] {
	const numImports = imports.length;
	return [Section.IMPORT, ...createVector([...unsignedLEB128(numImports), ...imports.flat()])];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createImportSection wraps imports correctly', () => {
		const imports = [createMemoryImport('js', 'memory')];
		const section = createImportSection(imports);
		expect(section[0]).toBe(Section.IMPORT);
	});
}
