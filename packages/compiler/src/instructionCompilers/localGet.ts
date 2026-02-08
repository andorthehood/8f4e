import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import localGet from '../wasmUtils/local/localGet';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `localGet`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const _localGet: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line, context) => {
		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
			const local = context.namespace.locals[line.arguments[0].value];

			if (!local) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			context.stack.push({ isInteger: local.isInteger, isNonZero: false });

			return saveByteCode(context, localGet(local.index));
		} else {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}
	}
);

export default _localGet;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('localGet instruction compiler', () => {
		it('loads a local value', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					locals: {
						value: { isInteger: true, index: 0 },
					},
				},
			});

			_localGet(
				{
					lineNumber: 1,
					instruction: 'localGet',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'value' }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('throws on undeclared local', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				_localGet(
					{
						lineNumber: 1,
						instruction: 'localGet',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'missing' }],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}
