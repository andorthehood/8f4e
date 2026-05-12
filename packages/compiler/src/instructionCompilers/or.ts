import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';
import { deriveKnownIntegerValue } from './utils/knownIntegerValue';

import type { InstructionCompiler, StackItem } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `or`.
 * @see [Instruction docs](../../docs/instructions/bitwise.md)
 */
const or: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 2 operands exist
	// We need to access operand values to track isNonZero for the OR operation
	const operand2 = context.stack.pop()!;
	const operand1 = context.stack.pop()!;
	const integerMetadata: Partial<StackItem> = deriveKnownIntegerValue(
		operand1,
		operand2,
		(value1, value2) => value1 | value2
	);

	context.stack.push({
		isInteger: true,
		isNonZero:
			integerMetadata.knownIntegerValue !== undefined
				? integerMetadata.knownIntegerValue !== 0
				: Boolean(operand1.isNonZero || operand2.isNonZero),
		...integerMetadata,
	});
	return saveByteCode(context, [WASMInstruction.I32_OR]);
};

export default or;
