import { WASMInstruction, f64const } from '@8f4e/compiler-wasm-utils';

import { compileSegment } from '../compiler';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `equalToZero`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const equalToZero: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		if (operand.isInteger) {
			context.stack.push({ isInteger: true, isNonZero: false });
			return saveByteCode(context, [WASMInstruction.I32_EQZ]);
		} else if (operand.isFloat64) {
			context.stack.push({ isInteger: true, isNonZero: false });
			return saveByteCode(context, [...f64const(0), WASMInstruction.F64_EQ]);
		} else {
			context.stack.push(operand);
			return compileSegment(['push 0.0', 'equal'], context);
		}
	}
);

export default equalToZero;
