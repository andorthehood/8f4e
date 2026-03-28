import { ArgumentType } from '../types';
import { ErrorCode } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
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
		const nameArg = line.arguments[0] as Extract<(typeof line.arguments)[number], { type: ArgumentType.IDENTIFIER }>;
		// Existence guaranteed by normalizeCompileTimeArguments
		const local = context.locals[nameArg.value]!;

		context.stack.push({
			isInteger: local.isInteger,
			...(local.isFloat64 ? { isFloat64: true } : {}),
			isNonZero: false,
		});

		return saveByteCode(context, localGet(local.index));
	}
);

export default _localGet;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('localGet instruction compiler', () => {
		it('loads a local value', () => {
			const context = createInstructionCompilerTestContext({
				locals: {
					value: { isInteger: true, index: 0 },
				},
			});

			_localGet(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
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
	});
}
