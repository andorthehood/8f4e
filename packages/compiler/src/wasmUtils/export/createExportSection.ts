import createFunctionExport from './createFunctionExport';

import createVector from '../encoding/createVector';
import unsignedLEB128 from '../encoding/unsignedLEB128';
import { Section } from '../section';

import type { FunctionExport } from '../section';

/**
 * Creates a WebAssembly export section containing function exports.
 *
 * @param _exports - Array of function exports
 * @returns Byte array representing the complete export section
 */
export default function createExportSection(_exports: FunctionExport[]): number[] {
	const numberOfExports = _exports.length;
	return [Section.EXPORT, ...createVector([...unsignedLEB128(numberOfExports), ..._exports.flat()])];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createExportSection wraps exports correctly', () => {
		const exports = [createFunctionExport('main', 0)];
		const section = createExportSection(exports);
		expect(section[0]).toBe(Section.EXPORT);
	});
}
