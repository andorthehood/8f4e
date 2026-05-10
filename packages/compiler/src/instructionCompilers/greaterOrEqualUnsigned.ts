import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { areAllOperandsFloat64, areAllOperandsIntegers } from '../utils/operandTypes';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `greaterOrEqualUnsigned`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const greaterOrEqualUnsigned: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 2 operands exist
	const operand2 = context.stack.pop()!;
	const operand1 = context.stack.pop()!;

	if (areAllOperandsIntegers(operand1, operand2)) {
		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [WASMInstruction.I32_GE_U]);
	}

	context.stack.push({ isInteger: true, isNonZero: false });
	return saveByteCode(context, [
		areAllOperandsFloat64(operand1, operand2) ? WASMInstruction.F64_GE : WASMInstruction.F32_GE,
	]);
};

export default greaterOrEqualUnsigned;
