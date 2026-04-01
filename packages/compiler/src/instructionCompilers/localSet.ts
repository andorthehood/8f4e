import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { localSet } from '@8f4e/compiler-wasm-utils';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, CodegenLocalSetLine, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `localSet`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const _localSet: InstructionCompiler<CodegenLocalSetLine> = withValidation<CodegenLocalSetLine>(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minOperands: 1,
	},
	(line: CodegenLocalSetLine, context) => {
		const operand = context.stack.pop()!;
		const local = context.locals[line.arguments[0].value]!;

		if (local.isInteger && !operand.isInteger) {
			throw getError(ErrorCode.ONLY_INTEGERS, line, context);
		}

		if (!local.isInteger && operand.isInteger) {
			throw getError(ErrorCode.ONLY_FLOATS, line, context);
		}

		return saveByteCode(context, localSet(local.index));
	}
);

export default _localSet;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('localSet instruction compiler', () => {
		it('stores a local value', () => {
			const context = createInstructionCompilerTestContext({
				locals: {
					value: { isInteger: true, index: 0 },
				},
			});
			context.stack.push({ isInteger: true, isNonZero: false });

			_localSet(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'localSet',
					arguments: [classifyIdentifier('value')],
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
