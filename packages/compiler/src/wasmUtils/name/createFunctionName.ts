import { FunctionName, unsignedLEB128, encodeString } from '../typeHelpers';

/**
 * Creates a function name entry for the name section.
 *
 * @param functionIndex - The index of the function
 * @param name - The debug name for the function
 * @returns Byte array representing the function name entry
 */
export function createFunctionName(functionIndex: number, name: string): FunctionName {
	return [...unsignedLEB128(functionIndex), ...encodeString(name)];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createFunctionName generates correct entry', () => {
		const name = createFunctionName(0, 'main');
		expect(name[0]).toBe(0);
	});
}
