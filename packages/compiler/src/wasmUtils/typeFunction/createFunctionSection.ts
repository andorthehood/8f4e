import createVector from '../encoding/createVector';
import unsignedLEB128 from '../encoding/unsignedLEB128';
import { Section } from '../section';

/**
 * Creates a WebAssembly function section that maps function indices to their type signatures.
 *
 * @param functionTypeIndexes - Array of type indices for each function
 * @returns Byte array representing the complete function section
 */
export default function createFunctionSection(functionTypeIndexes: number[]): number[] {
	const numberOfFunctions = functionTypeIndexes.length;

	return [Section.FUNCTION, ...createVector([...unsignedLEB128(numberOfFunctions), ...functionTypeIndexes])];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createFunctionSection generates correct section', () => {
		expect(createFunctionSection([0])).toStrictEqual([3, 2, 1, 0]);
		expect(createFunctionSection([0, 1, 2])).toStrictEqual([3, 4, 3, 0, 1, 2]);
	});
}
