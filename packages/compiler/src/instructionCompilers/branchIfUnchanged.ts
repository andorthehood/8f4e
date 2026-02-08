import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `branchIfUnchanged`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branchIfUnchanged: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push(operand);

		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type !== ArgumentType.LITERAL) {
			throw getError(ErrorCode.EXPECTED_VALUE, line, context);
		}

		const depth = line.arguments[0].value;
		const type = operand.isInteger ? 'int' : 'float';
		const previousValueMemoryName = '__branchIfUnchanged_previousValue' + line.lineNumber;
		const currentValueMemoryName = '__branchIfUnchanged_currentValue' + line.lineNumber;

		return compileSegment(
			[
				`${type} ${previousValueMemoryName} 0`,
				`local ${type} ${currentValueMemoryName}`,

				`localSet ${currentValueMemoryName} `,

				`push ${previousValueMemoryName}`,
				`localGet ${currentValueMemoryName}`,
				'equal',
				`branchIfTrue ${depth}`,

				`push &${previousValueMemoryName}`,
				`localGet ${currentValueMemoryName}`,
				'store',
			],
			context
		);
	}
);

export default branchIfUnchanged;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('branchIfUnchanged instruction compiler', () => {
		it('compiles the unchanged check segment', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true });

			branchIfUnchanged(
				{
					lineNumber: 4,
					instruction: 'branchIfUnchanged',
					arguments: [{ type: ArgumentType.LITERAL, value: 1, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
				memory: context.namespace.memory,
				locals: context.namespace.locals,
			}).toMatchSnapshot();
		});

		it('throws on missing argument', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: false });

			expect(() => {
				branchIfUnchanged({ lineNumber: 1, instruction: 'branchIfUnchanged', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
