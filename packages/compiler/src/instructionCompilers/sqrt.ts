import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `sqrt`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const sqrt: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 1 operand exists
	const operand = context.stack.pop()!;

	context.stack.push({ isInteger: false, ...(operand.isFloat64 ? { isFloat64: true } : {}), isNonZero: false });
	return saveByteCode(context, [operand.isFloat64 ? WASMInstruction.F64_SQRT : WASMInstruction.F32_SQRT]);
};

export default sqrt;
