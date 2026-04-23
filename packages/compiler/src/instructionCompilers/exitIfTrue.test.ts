import { describe, expect, it } from 'vitest';
import { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';

import exitIfTrue from './exitIfTrue';

import { ErrorCode } from '../compilerError';
import { BLOCK_TYPE } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('exitIfTrue instruction compiler', () => {
	it('emits a conditional early module exit and preserves the fallthrough stack', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false });
		context.stack.push({ isInteger: true, isNonZero: false });

		exitIfTrue(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'exitIfTrue',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.byteCode).toEqual([
			WASMInstruction.IF,
			Type.VOID,
			WASMInstruction.DROP,
			WASMInstruction.RETURN,
			WASMInstruction.END,
		]);
		expect(context.stack).toEqual([{ isInteger: false, isNonZero: false }]);
	});

	it('throws when used inside a function', () => {
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
		context.stack.push({ isInteger: true, isNonZero: false });

		try {
			exitIfTrue(
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
