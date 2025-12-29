import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `abs`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const abs: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		if (operand.isInteger) {
			context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });
			const valueName = '__absify_value' + line.lineNumber;

			return compileSegment(
				[
					`local int ${valueName}`,
					`localSet ${valueName}`,
					`localGet ${valueName}`,
					'push 0',
					'lessThan',
					'if',
					' push 0',
					` localGet ${valueName}`,
					' sub',
					'else',
					` localGet ${valueName}`,
					'ifEnd',
				],
				context
			);
		} else {
			context.stack.push({ isInteger: false, isNonZero: operand.isNonZero });
			return saveByteCode(context, [WASMInstruction.F32_ABS]);
		}
	}
);

export default abs;
