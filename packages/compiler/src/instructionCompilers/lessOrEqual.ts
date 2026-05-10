import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { areAllOperandsFloat64, areAllOperandsIntegers } from '../utils/operandTypes';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `lessOrEqual`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const lessOrEqual: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 2 operands exist
	const operand2 = context.stack.pop()!;
	const operand1 = context.stack.pop()!;

	const isInteger = areAllOperandsIntegers(operand1, operand2);
	const isFloat64 = areAllOperandsFloat64(operand1, operand2);
	context.stack.push({ isInteger: true, isNonZero: false });
	return saveByteCode(context, [
		isInteger ? WASMInstruction.I32_LE_S : isFloat64 ? WASMInstruction.F64_LE : WASMInstruction.F32_LE,
	]);
};

export default lessOrEqual;
