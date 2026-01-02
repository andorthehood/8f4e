import createVector from '../encoding/createVector';
import unsignedLEB128 from '../encoding/unsignedLEB128';
import Instruction from '../wasmInstruction';

import type { FunctionBody, LocalDeclaration } from '../section';

/**
 * Creates a complete WebAssembly function body with local declarations and instructions.
 *
 * @param localDeclarations - Array of local variable declarations
 * @param functionBody - The function's instruction bytecode
 * @returns Byte array representing the complete function body (with size prefix)
 */
export default function createFunction(localDeclarations: LocalDeclaration[], functionBody: number[]): FunctionBody {
	const localDeclarationCount = localDeclarations.length;
	return createVector([
		...unsignedLEB128(localDeclarationCount),
		...localDeclarations.flat(),
		...functionBody,
		Instruction.END,
	]);
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test('createFunction wraps body with locals and end', () => {
		const func = createFunction([], [65, 42]);
		expect(func[func.length - 1]).toBe(Instruction.END);
	});
}
