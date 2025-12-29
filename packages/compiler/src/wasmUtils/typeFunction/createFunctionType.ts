import { FunctionType, unsignedLEB128 } from '../typeHelpers';
import Type from '../type';

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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createFunctionType generates correct signature', () => {
		const funcType = createFunctionType([Type.I32, Type.I32], [Type.I32]);
		expect(funcType).toStrictEqual([0x60, 2, Type.I32, Type.I32, 1, Type.I32]);
	});
}
