import { ArgumentType } from '../types';
import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

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

		const tempVariableName = '__ensureNonZero_temp_' + line.lineNumber;

		if (operand.isInteger) {
			const ret = compileSegment(
				[
					`local int ${tempVariableName}`,
					`localSet ${tempVariableName}`,
					`localGet ${tempVariableName}`,
					'equalToZero',
					'if int',
					`push ${defaultNonZeroValue}`,
					'else',
					`localGet ${tempVariableName}`,
					'ifEnd',
				],
				context
			);
			context.stack.pop();
			context.stack.push({ isInteger: true, isNonZero: true });
			return ret;
		} else {
			const localType = operand.isFloat64 ? 'float64' : 'float';
			const ret = compileSegment(
				[
					`local ${localType} ${tempVariableName}`,
					`localSet ${tempVariableName}`,
					`localGet ${tempVariableName}`,
					'equalToZero',
					'if void',
					`push ${defaultNonZeroValue}`,
					`localSet ${tempVariableName}`,
					'ifEnd',
					`localGet ${tempVariableName}`,
				],
				context
			);
			context.stack.pop();
			context.stack.push({ isInteger: false, ...(operand.isFloat64 ? { isFloat64: true } : {}), isNonZero: true });
			return ret;
		}
	}
);

export default ensureNonZero;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('ensureNonZero instruction compiler', () => {
		it('ensures integer operand is non-zero', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			ensureNonZero({ lineNumber: 1, instruction: 'ensureNonZero', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				locals: context.namespace.locals,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('ensures float operand is non-zero with literal default', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: false });

			ensureNonZero(
				{
					lineNumber: 2,
					instruction: 'ensureNonZero',
					arguments: [{ type: ArgumentType.LITERAL, value: 2.5, isInteger: false }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				locals: context.namespace.locals,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('ensures float64 operand is non-zero with float64 default', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isFloat64: true, isNonZero: false });

			ensureNonZero(
				{
					lineNumber: 3,
					instruction: 'ensureNonZero',
					arguments: [{ type: ArgumentType.LITERAL, value: 2.5, isInteger: false, isFloat64: true }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				locals: context.namespace.locals,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
