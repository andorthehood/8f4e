import { describe, expect, it } from 'vitest';
import { i32const, localGet, WASM_I32_SUB } from '@8f4e/compiler-wasm-utils';
import { BlockType } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import loopIndex from './loopIndex';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { CompilerASTLine } from '@8f4e/compiler-spec';

describe('loopIndex instruction compiler', () => {
	it('reads the nearest active loop counter as a zero-based index', () => {
		const loopCounterLocal = { isInteger: true, index: 3 };
		const context = createInstructionCompilerTestContext({
			locals: {
				__loopCounter2: loopCounterLocal,
			},
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
				{
					blockType: BlockType.LOOP,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
					loopCounterLocalName: '__loopCounter2',
					loopCounterLocal,
				},
			],
		});

		analyzeAndCompileInstruction(
			loopIndex,
			{
				lineNumberBeforeMacroExpansion: 10,
				lineNumberAfterMacroExpansion: 10,
				instruction: 'loopIndex',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).toEqual([...localGet(3), ...i32const(1), WASM_I32_SUB]);
		expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
	});

	it('uses the innermost loop when nested', () => {
		const outerLoopCounterLocal = { isInteger: true, index: 1 };
		const innerLoopCounterLocal = { isInteger: true, index: 2 };
		const context = createInstructionCompilerTestContext({
			locals: {
				__outer: outerLoopCounterLocal,
				__inner: innerLoopCounterLocal,
			},
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
				{
					blockType: BlockType.LOOP,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
					loopCounterLocalName: '__outer',
					loopCounterLocal: outerLoopCounterLocal,
				},
				{
					blockType: BlockType.LOOP,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
					loopCounterLocalName: '__inner',
					loopCounterLocal: innerLoopCounterLocal,
				},
			],
		});

		analyzeAndCompileInstruction(
			loopIndex,
			{
				lineNumberBeforeMacroExpansion: 10,
				lineNumberAfterMacroExpansion: 10,
				instruction: 'loopIndex',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).toEqual([...localGet(2), ...i32const(1), WASM_I32_SUB]);
	});

	it('throws outside a loop', () => {
		const context = createInstructionCompilerTestContext();

		try {
			analyzeAndCompileInstruction(
				loopIndex,
				{
					lineNumberBeforeMacroExpansion: 10,
					lineNumberAfterMacroExpansion: 10,
					instruction: 'loopIndex',
					arguments: [],
				} as CompilerASTLine,
				context
			);
		} catch (error) {
			expect(error).toMatchObject({ code: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_LOOP });
			return;
		}

		throw new Error('Expected loopIndex to throw outside a loop');
	});
});
