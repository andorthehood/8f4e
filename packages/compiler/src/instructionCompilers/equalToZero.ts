import { WASMInstruction, f32const, f64const } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `equalToZero`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const equalToZero: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 1 operand exists
	const operand = context.stack.pop()!;

	if (operand.isInteger) {
		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [WASMInstruction.I32_EQZ]);
	} else if (operand.isFloat64) {
		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [...f64const(0), WASMInstruction.F64_EQ]);
	} else {
		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [...f32const(0), WASMInstruction.F32_EQ]);
	}
};

export default equalToZero;
