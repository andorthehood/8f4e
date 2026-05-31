import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { BlockType, ErrorCode } from '@8f4e/compiler-spec';
import { WASM_DROP, WASM_END, WASM_IF, WASM_RETURN, WASM_TYPE_VOID } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import exitIfTrue from './exitIfTrue';

describe('exitIfTrue instruction compiler', () => {
	it('emits a conditional early module exit and preserves the fallthrough stack', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: false });
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			exitIfTrue,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'exitIfTrue',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).toEqual([WASM_IF, WASM_TYPE_VOID, WASM_DROP, WASM_RETURN, WASM_END]);
		expect(context.stack).toEqual([{ kind: 'value', valueType: 'float', isNonZero: false }]);
	});

	it('throws when used inside a function', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
			],
		});
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		try {
			analyzeAndCompileInstruction(
				exitIfTrue,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'exitIfTrue',
					arguments: [],
				} as CompilerASTLine,
				context
			);
		} catch (error) {
			expect(error).toMatchObject({ code: ErrorCode.EXIT_IF_TRUE_OUTSIDE_MODULE });
			return;
		}

		throw new Error('Expected exitIfTrue to throw inside a function');
	});
});
