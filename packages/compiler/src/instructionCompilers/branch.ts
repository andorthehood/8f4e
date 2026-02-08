import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import br from '../wasmUtils/controlFlow/br';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `branch`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branch: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.EXPECTED_VALUE, line, context);
		} else {
			return saveByteCode(context, br(line.arguments[0].value));
		}
	}
);

export default branch;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('branch instruction compiler', () => {
		it('emits br bytecode', () => {
			const context = createInstructionCompilerTestContext();

			branch(
				{
					lineNumber: 1,
					instruction: 'branch',
					arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('throws on missing argument', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				branch({ lineNumber: 1, instruction: 'branch', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
