import { FunctionType, unsignedLEB128, createVector } from './typeHelpers';
import { Section } from './section';
import Type from './type';

/**
 * Creates a WebAssembly function type signature (param types → result types).
 *
 * @param parameterTypes - Array of parameter types
 * @param resultTypes - Array of result types (defaults to empty)
 * @returns Byte array representing the function type
 */
export function createFunctionType(parameterTypes: Type[], resultTypes: Type[] = []): FunctionType {
	const numberOfParameters = parameterTypes.length;
	const numberOfResults = resultTypes.length;

	return [
		0x60,
		...unsignedLEB128(numberOfParameters),
		...parameterTypes,
		...unsignedLEB128(numberOfResults),
		...resultTypes,
	];
}

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

/**
 * Creates a WebAssembly function section that maps function indices to their type signatures.
 *
 * @param functionTypeIndexes - Array of type indices for each function
 * @returns Byte array representing the complete function section
 */
export function createFunctionSection(functionTypeIndexes: number[]): number[] {
	const numberOfFunctions = functionTypeIndexes.length;

	return [Section.FUNCTION, ...createVector([...unsignedLEB128(numberOfFunctions), ...functionTypeIndexes])];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createFunctionType generates correct signature', () => {
		const funcType = createFunctionType([Type.I32, Type.I32], [Type.I32]);
		expect(funcType).toStrictEqual([0x60, 2, Type.I32, Type.I32, 1, Type.I32]);
	});

	test('createTypeSection wraps types correctly', () => {
		const types = [createFunctionType([], [])];
		const section = createTypeSection(types);
		expect(section[0]).toBe(Section.TYPE);
	});

	test('createFunctionSection generates correct section', () => {
		expect(createFunctionSection([0])).toStrictEqual([3, 2, 1, 0]);
		expect(createFunctionSection([0, 1, 2])).toStrictEqual([3, 4, 3, 0, 1, 2]);
	});
}
