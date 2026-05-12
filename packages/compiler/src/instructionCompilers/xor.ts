import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { deriveKnownIntegerValue } from '../utils/knownIntegerValue';

import type { InstructionCompiler, StackItem } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `xor`.
 * @see [Instruction docs](../../docs/instructions/bitwise.md)
 */
const xor: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 2 operands exist
	const operand2 = context.stack.pop()!;
	const operand1 = context.stack.pop()!;
	const integerMetadata: Partial<StackItem> = deriveKnownIntegerValue(
		operand1,
		operand2,
		(value1, value2) => value1 ^ value2
	);

	context.stack.push({
		isInteger: true,
		isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
		...integerMetadata,
	});
	return saveByteCode(context, [WASMInstruction.I32_XOR]);
};

export default xor;
