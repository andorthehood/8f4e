import { FunctionExport, encodeString, unsignedLEB128, createVector } from './typeHelpers';
import { ExportDesc, Section } from './section';

/**
 * Creates a function export entry that makes a function accessible from outside the module.
 *
 * @param name - The export name
 * @param reference - The function index to export
 * @returns Byte array representing the function export entry
 */
export function createFunctionExport(name: string, reference: number): FunctionExport {
	return [...encodeString(name), ExportDesc.FUNC, reference];
}

/**
 * Creates a WebAssembly export section containing function exports.
 *
 * @param _exports - Array of function exports
 * @returns Byte array representing the complete export section
 */
export function createExportSection(_exports: FunctionExport[]): number[] {
	const numberOfExports = _exports.length;
	return [Section.EXPORT, ...createVector([...unsignedLEB128(numberOfExports), ..._exports.flat()])];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createFunctionExport generates correct entry', () => {
		const exp = createFunctionExport('test', 0);
		expect(exp).toContain(ExportDesc.FUNC);
		expect(exp).toContain(0);
	});

	test('createExportSection wraps exports correctly', () => {
		const exports = [createFunctionExport('main', 0)];
		const section = createExportSection(exports);
		expect(section[0]).toBe(Section.EXPORT);
	});
}
