import { WASMInstruction, f32const, f64const, i32const } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `notZero`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const notZero: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 1 operand exists
	const operand = context.stack.pop()!;

	if (operand.isInteger) {
		context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });
		return saveByteCode(context, [...i32const(0), WASMInstruction.I32_NE]);
	} else if (operand.isFloat64) {
		context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });
		return saveByteCode(context, [...f64const(0), WASMInstruction.F64_NE]);
	} else {
		context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });
		return saveByteCode(context, [...f32const(0), WASMInstruction.F32_NE]);
	}
};

export default notZero;
