import { FunctionName, unsignedLEB128, createVector, encodeString } from './typeHelpers';
import { NameSection, Section } from './section';

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

/**
 * Creates a WebAssembly name section for debugging information.
 *
 * @param functionNames - Array of function name entries
 * @returns Byte array representing the complete custom name section
 */
export function createNameSection(functionNames: FunctionName[]): number[] {
	const numFunctions = functionNames.length;
	return [
		Section.CUSTOM,
		...createVector([
			...encodeString('name'),
			NameSection.FUNCTION_NAME,
			...createVector([...unsignedLEB128(numFunctions), ...functionNames.flat()]),
		]),
	];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createFunctionName generates correct entry', () => {
		const name = createFunctionName(0, 'main');
		expect(name[0]).toBe(0);
	});

	test('createNameSection wraps function names correctly', () => {
		const names = [createFunctionName(0, 'main')];
		const section = createNameSection(names);
		expect(section[0]).toBe(Section.CUSTOM);
	});
}
