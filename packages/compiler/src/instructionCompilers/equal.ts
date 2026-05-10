import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { areAllOperandsFloat64, areAllOperandsIntegers } from '../utils/operandTypes';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `equal`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const equal: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 2 operands exist
	const operand2 = context.stack.pop()!;
	const operand1 = context.stack.pop()!;

	const isInteger = areAllOperandsIntegers(operand1, operand2);
	const isFloat64 = areAllOperandsFloat64(operand1, operand2);
	context.stack.push({ isInteger: true, isNonZero: false });
	return saveByteCode(context, [
		isInteger ? WASMInstruction.I32_EQ : isFloat64 ? WASMInstruction.F64_EQ : WASMInstruction.F32_EQ,
	]);
};

export default equal;
