import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { areAllOperandsIntegers } from '../utils/operandTypes';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `notEqual`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const notEqual: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'matching',
	},
	(line, context) => {
		const operand2 = context.stack.pop()!;
		const operand1 = context.stack.pop()!;

		const isInteger = areAllOperandsIntegers(operand1, operand2);
		const isFloat64 = !isInteger && !!operand1.isFloat64;

		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [
			isInteger ? WASMInstruction.I32_NE : isFloat64 ? WASMInstruction.F64_NE : WASMInstruction.F32_NE,
		]);
	}
);

export default notEqual;
