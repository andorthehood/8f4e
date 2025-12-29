import { LocalDeclaration, unsignedLEB128 } from '../typeHelpers';
import Type from '../type';

/**
 * Creates a local variable declaration for a WebAssembly function.
 *
 * @param type - The type of the local variable
 * @param typeCount - Number of consecutive locals of this type (defaults to 1)
 * @returns Byte array representing the local declaration
 */
export function createLocalDeclaration(type: Type, typeCount = 1): LocalDeclaration {
	return [...unsignedLEB128(typeCount), type];
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createLocalDeclaration generates correct format', () => {
		const decl = createLocalDeclaration(Type.I32, 2);
		expect(decl).toStrictEqual([2, Type.I32]);
	});
}
