import createMemoryImport from './createMemoryImport';

import createVector from '../encoding/createVector';
import unsignedLEB128 from '../encoding/unsignedLEB128';
import { Section } from '../section';

import type { Import } from '../section';

/**
 * Creates a WebAssembly import section containing import declarations.
 *
 * @param imports - Array of import entries
 * @returns Byte array representing the complete import section
 */
export default function createImportSection(imports: Import[]): number[] {
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
