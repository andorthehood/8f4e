import { ErrorCode } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { localGet } from '@8f4e/compiler-wasm-utils';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, CodegenLocalGetLine, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `localGet`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const _localGet: InstructionCompiler<CodegenLocalGetLine> = withValidation<CodegenLocalGetLine>(
	{
		scope: 'moduleOrFunction',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line: CodegenLocalGetLine, context) => {
		const local = context.locals[line.arguments[0].value]!;

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
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

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
