import { encodeString } from '../encoding/encodeString';
import { ExportDesc } from '../section';

import type { FunctionExport } from '../section';

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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createFunctionExport generates correct entry', () => {
		const exp = createFunctionExport('test', 0);
		expect(exp).toContain(ExportDesc.FUNC);
		expect(exp).toContain(0);
	});
}
