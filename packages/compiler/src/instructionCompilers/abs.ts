import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { compileSegment } from '../compiler';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

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
			const valueName = '__absify_value' + line.lineNumberAfterMacroExpansion;

			// compileSegment is used here because i32 has no native abs opcode;
			// the if/else/ifEnd control flow genuinely benefits from composed instruction semantics.
			return compileSegment(
				[
					`local int ${valueName}`,
					`localSet ${valueName}`,
					`push ${valueName}`,
					'push 0',
					'lessThan',
					'if',
					' push 0',
					` push ${valueName}`,
					' sub',
					'else',
					` push ${valueName}`,
					'ifEnd int',
				],
				context
			);
		} else {
			context.stack.push({
				isInteger: false,
				...(operand.isFloat64 ? { isFloat64: true } : {}),
				isNonZero: operand.isNonZero,
			});
			return saveByteCode(context, [operand.isFloat64 ? WASMInstruction.F64_ABS : WASMInstruction.F32_ABS]);
		}
	}
);

export default abs;
