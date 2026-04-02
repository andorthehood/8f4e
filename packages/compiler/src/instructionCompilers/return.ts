import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { ErrorCode } from '../compilerError';
import { BLOCK_TYPE } from '../types';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `return`.
 *
 * Emits a WebAssembly `return` instruction, immediately returning from the
 * enclosing function. Only valid inside a function block — not in a module.
 *
 * The return type is already declared by `functionEnd`; the WASM validator
 * ensures the stack matches. Takes no arguments.
 *
 * @see [Instruction docs](../../docs/instructions/blocks/function.md)
 */
const _return: InstructionCompiler = withValidation(
	{
		scope: 'function',
		onInvalidScope: ErrorCode.RETURN_OUTSIDE_FUNCTION,
	},
	(line, context) => {
		saveByteCode(context, [WASMInstruction.RETURN]);

		// Clear the stack — execution does not continue past a return
		context.stack = [];

		return context;
	}
);

export default _return;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('return instruction compiler', () => {
		it('emits WASM return opcode and clears the stack', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					...createInstructionCompilerTestContext().blockStack,
					{
						blockType: BLOCK_TYPE.FUNCTION,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
				],
			});
			context.stack.push({ isInteger: false, isNonZero: false });

			_return(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'return',
					arguments: [],
				} as AST[number],
				context
			);

			expect({ byteCode: context.byteCode, stack: context.stack }).toMatchSnapshot();
		});

		it('throws when used outside a function', () => {
			const context = createInstructionCompilerTestContext();
			// default context has MODULE block, not FUNCTION

			expect(() => {
				_return(
					{
						lineNumberBeforeMacroExpansion: 1,
						lineNumberAfterMacroExpansion: 1,
						instruction: 'return',
						arguments: [],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}
