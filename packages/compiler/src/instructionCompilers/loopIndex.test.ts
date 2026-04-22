import { describe, expect, it } from 'vitest';
import { i32const, localGet, WASMInstruction } from '@8f4e/compiler-wasm-utils';

import loopIndex from './loopIndex';

import { ErrorCode } from '../compilerError';
import { BLOCK_TYPE } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('loopIndex instruction compiler', () => {
	it('reads the nearest active loop counter as a zero-based index', () => {
		const context = createInstructionCompilerTestContext({
			locals: {
				__loopCounter2: { isInteger: true, index: 3 },
			},
			blockStack: [
				{
					blockType: BLOCK_TYPE.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
				{
					blockType: BLOCK_TYPE.LOOP,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
					loopCounterLocalName: '__loopCounter2',
				},
			],
		});

		loopIndex(
			{
				lineNumberBeforeMacroExpansion: 10,
				lineNumberAfterMacroExpansion: 10,
				instruction: 'loopIndex',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.byteCode).toEqual([...localGet(3), ...i32const(1), WASMInstruction.I32_SUB]);
		expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
	});

	it('uses the innermost loop when nested', () => {
		const context = createInstructionCompilerTestContext({
			locals: {
				__outer: { isInteger: true, index: 1 },
				__inner: { isInteger: true, index: 2 },
			},
			blockStack: [
				{
					blockType: BLOCK_TYPE.MODULE,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
				},
				{
					blockType: BLOCK_TYPE.LOOP,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
					loopCounterLocalName: '__outer',
				},
				{
					blockType: BLOCK_TYPE.LOOP,
					expectedResultIsInteger: false,
					hasExpectedResult: false,
					loopCounterLocalName: '__inner',
				},
			],
		});

		loopIndex(
			{
				lineNumberBeforeMacroExpansion: 10,
				lineNumberAfterMacroExpansion: 10,
				instruction: 'loopIndex',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.byteCode).toEqual([...localGet(2), ...i32const(1), WASMInstruction.I32_SUB]);
	});

	it('throws outside a loop', () => {
		const context = createInstructionCompilerTestContext();

		try {
			loopIndex(
				{
					lineNumberBeforeMacroExpansion: 10,
					lineNumberAfterMacroExpansion: 10,
					instruction: 'loopIndex',
					arguments: [],
				} as AST[number],
				context
			);
		} catch (error) {
			expect(error).toMatchObject({ code: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_LOOP });
			return;
		}

		throw new Error('Expected loopIndex to throw outside a loop');
	});
});
