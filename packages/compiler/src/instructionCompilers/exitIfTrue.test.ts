import { describe, expect, it } from 'vitest';
import { WASM_DROP, WASM_END, WASM_IF, WASM_RETURN, WASM_TYPE_VOID } from '@8f4e/compiler-wasm-utils';
import { BlockType, ErrorCode } from '@8f4e/compiler-spec';

import exitIfTrue from './exitIfTrue';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('exitIfTrue instruction compiler', () => {
	it('emits a conditional early module exit and preserves the fallthrough stack', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false });
		context.stack.push({ isInteger: true, isNonZero: false });

		analyzeAndCompileInstruction(
			exitIfTrue,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'exitIfTrue',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.byteCode).toEqual([WASM_IF, WASM_TYPE_VOID, WASM_DROP, WASM_RETURN, WASM_END]);
		expect(context.stack).toEqual([{ isInteger: false, isNonZero: false }]);
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
		context.stack.push({ isInteger: true, isNonZero: false });

		try {
			analyzeAndCompileInstruction(
				exitIfTrue,
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'exitIfTrue',
					arguments: [],
				} as AST[number],
				context
			);
		} catch (error) {
			expect(error).toMatchObject({ code: ErrorCode.EXIT_IF_TRUE_OUTSIDE_MODULE });
			return;
		}

		throw new Error('Expected exitIfTrue to throw inside a function');
	});
});
