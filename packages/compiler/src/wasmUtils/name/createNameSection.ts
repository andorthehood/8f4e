import createFunctionName from './createFunctionName';

import createVector from '../encoding/createVector';
import encodeString from '../encoding/encodeString';
import unsignedLEB128 from '../encoding/unsignedLEB128';
import { NameSection, Section } from '../section';

import type { FunctionName } from '../section';

/**
 * Creates a WebAssembly name section for debugging information.
 *
 * @param functionNames - Array of function name entries
 * @returns Byte array representing the complete custom name section
 */
export default function createNameSection(functionNames: FunctionName[]): number[] {
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

	test('createNameSection wraps function names correctly', () => {
		const names = [createFunctionName(0, 'main')];
		const section = createNameSection(names);
		expect(section[0]).toBe(Section.CUSTOM);
	});
}
