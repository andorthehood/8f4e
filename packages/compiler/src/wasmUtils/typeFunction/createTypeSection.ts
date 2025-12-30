import { createFunctionType } from './createFunctionType';

import { FunctionType, unsignedLEB128, createVector } from '../typeHelpers';
import { Section } from '../section';

/**
 * Creates a WebAssembly type section containing function type signatures.
 *
 * @param types - Array of function types to include in the section
 * @returns Byte array representing the complete type section
 */
export function createTypeSection(types: FunctionType[]): number[] {
	const numberOfTypes = types.length;
	return [Section.TYPE, ...createVector([...unsignedLEB128(numberOfTypes), ...types.flat()])];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createTypeSection wraps types correctly', () => {
		const types = [createFunctionType([], [])];
		const section = createTypeSection(types);
		expect(section[0]).toBe(Section.TYPE);
	});
}
