import { FunctionBody, LocalDeclaration, unsignedLEB128, createVector } from './typeHelpers';
import Instruction from './wasmInstruction';
import { Section } from './section';
import Type from './type';

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

/**
 * Creates a complete WebAssembly function body with local declarations and instructions.
 *
 * @param localDeclarations - Array of local variable declarations
 * @param functionBody - The function's instruction bytecode
 * @returns Byte array representing the complete function body (with size prefix)
 */
export function createFunction(localDeclarations: LocalDeclaration[], functionBody: number[]): FunctionBody {
	const localDeclarationCount = localDeclarations.length;
	return createVector([
		...unsignedLEB128(localDeclarationCount),
		...localDeclarations.flat(),
		...functionBody,
		Instruction.END,
	]);
}

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

	test('createLocalDeclaration generates correct format', () => {
		const decl = createLocalDeclaration(Type.I32, 2);
		expect(decl).toStrictEqual([2, Type.I32]);
	});

	test('createFunction wraps body with locals and end', () => {
		const func = createFunction([], [65, 42]);
		expect(func[func.length - 1]).toBe(Instruction.END);
	});

	test('createCodeSection wraps function bodies correctly', () => {
		const bodies = [createFunction([], [65, 1])];
		const section = createCodeSection(bodies);
		expect(section[0]).toBe(Section.CODE);
	});
}
