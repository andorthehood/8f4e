import { compileSegment } from '../compiler';
import { ArgumentType } from '../types';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `ensureNonZero`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const ensureNonZero: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push(operand);

		let defaultNonZeroValue = operand.isInteger ? '1' : '1.0';

		// If the operand is float we convert the argument to a float string.
		if (line.arguments[0] && line.arguments[0].type === ArgumentType.LITERAL && !operand.isInteger) {
			defaultNonZeroValue = line.arguments[0].value.toFixed(1);
		}

		// If the operand is integer we convert the argument to an integer string.
		if (line.arguments[0] && line.arguments[0].type === ArgumentType.LITERAL && operand.isInteger) {
			defaultNonZeroValue = line.arguments[0].value.toString();
		}

		if (!operand.isInteger && operand.isFloat64) {
			defaultNonZeroValue = defaultNonZeroValue + 'f64';
		}

		const tempVariableName = '__ensureNonZero_temp_' + line.lineNumberAfterMacroExpansion;

		if (operand.isInteger) {
			// compileSegment is used here for complex conditional logic: there is no
			// single wasm opcode sequence for "use fallback if zero"; the if/else/ifEnd
			// control flow structure genuinely benefits from composed instruction semantics.
			const ret = compileSegment(
				[
					`local int ${tempVariableName}`,
					`localSet ${tempVariableName}`,
					`push ${tempVariableName}`,
					'equalToZero',
					'if',
					`push ${defaultNonZeroValue}`,
					'else',
					`push ${tempVariableName}`,
					'ifEnd int',
				],
				context
			);
			context.stack.pop();
			context.stack.push({ isInteger: true, isNonZero: true });
			return ret;
		} else {
			const localType = operand.isFloat64 ? 'float64' : 'float';
			// Same rationale as the integer branch: conditional fallback requires control flow.
			const ret = compileSegment(
				[
					`local ${localType} ${tempVariableName}`,
					`localSet ${tempVariableName}`,
					`push ${tempVariableName}`,
					'equalToZero',
					'if',
					`push ${defaultNonZeroValue}`,
					`localSet ${tempVariableName}`,
					'ifEnd',
					`push ${tempVariableName}`,
				],
				context
			);
			context.stack.pop();
			context.stack.push({
				isInteger: false,
				...(operand.isFloat64 ? { isFloat64: true } : {}),
				isNonZero: true,
			});
			return ret;
		}
	}
);

export default ensureNonZero;
