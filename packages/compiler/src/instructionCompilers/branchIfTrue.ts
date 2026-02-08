import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import br_if from '../wasmUtils/controlFlow/br_if';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `branchIfTrue`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branchIfTrue: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.EXPECTED_VALUE, line, context);
		}

		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		context.byteCode.push(...br_if(line.arguments[0].value));
		return context;
	}
);

export default branchIfTrue;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('branchIfTrue instruction compiler', () => {
		it('emits br_if bytecode', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true });

			branchIfTrue(
				{
					lineNumber: 1,
					instruction: 'branchIfTrue',
					arguments: [{ type: ArgumentType.LITERAL, value: 2, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('throws on missing argument', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true });

			expect(() => {
				branchIfTrue({ lineNumber: 1, instruction: 'branchIfTrue', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
