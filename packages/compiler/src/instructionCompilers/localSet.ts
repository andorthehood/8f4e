import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import localSet from '../wasmUtils/local/localSet';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `localSet`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const _localSet: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 1,
		onInsufficientOperands: ErrorCode.INSUFFICIENT_OPERANDS,
	},
	(line, context) => {
		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
			const operand = context.stack.pop()!;
			const local = context.namespace.locals[line.arguments[0].value];

			if (!local) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			if (local.isInteger && !operand.isInteger) {
				throw getError(ErrorCode.ONLY_INTEGERS, line, context);
			}

			if (!local.isInteger && operand.isInteger) {
				throw getError(ErrorCode.ONLY_FLOATS, line, context);
			}

			context.byteCode.push(...localSet(local.index));
			return context;
		} else {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}
	}
);

export default _localSet;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('localSet instruction compiler', () => {
		it('stores a local value', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					locals: {
						value: { isInteger: true, index: 0 },
					},
				},
			});
			context.stack.push({ isInteger: true, isNonZero: false });

			_localSet(
				{
					lineNumber: 1,
					instruction: 'localSet',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'value' }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('throws on missing arguments', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			expect(() => {
				_localSet({ lineNumber: 1, instruction: 'localSet', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
