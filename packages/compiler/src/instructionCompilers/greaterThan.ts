import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { areAllOperandsIntegers } from '../utils/operandTypes';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `greaterThan`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const greaterThan: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 2 operands exist
	const operand2 = context.stack.pop()!;
	const operand1 = context.stack.pop()!;

	const isInteger = areAllOperandsIntegers(operand1, operand2);
	context.stack.push({ isInteger: true, isNonZero: false });
	return saveByteCode(context, [isInteger ? WASMInstruction.I32_GT_S : WASMInstruction.F32_GT]);
};

export default greaterThan;
