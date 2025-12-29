import { createFunction } from './createFunction';

import { FunctionBody, unsignedLEB128, createVector } from '../typeHelpers';
import { Section } from '../section';

/**
 * Creates a WebAssembly code section containing function bodies.
 *
 * @param functionBodies - Array of function bodies to include
 * @returns Byte array representing the complete code section
 */
export function createCodeSection(functionBodies: FunctionBody[]): number[] {
	const numberOfFunctions = functionBodies.length;
	return [Section.CODE, ...createVector([...unsignedLEB128(numberOfFunctions), ...functionBodies.flat()])];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createCodeSection wraps function bodies correctly', () => {
		const bodies = [createFunction([], [65, 1])];
		const section = createCodeSection(bodies);
		expect(section[0]).toBe(Section.CODE);
	});
}
