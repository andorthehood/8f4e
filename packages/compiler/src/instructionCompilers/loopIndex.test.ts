import { i32const, localGet, WASM_I32_SUB } from '@8f4e/compiler-wasm-utils';
import type { CompilerASTLine } from '@8f4e/language-spec';
import { BlockType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import loopIndex from './loopIndex';

describe('loopIndex instruction compiler', () => {
	it('reads the nearest active loop counter as a zero-based index', () => {
		const loopCounterLocal = { kind: 'value', valueType: 'int', index: 3 };
		const context = createInstructionCompilerTestContext({
			locals: {
				__loopCounter2: loopCounterLocal,
			},
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultTypes: [],
				},
				{
					blockType: BlockType.LOOP,
					expectedResultTypes: [],
					loopCounterLocalName: '__loopCounter2',
					loopCounterLocal,
				},
			],
		});

		analyzeAndCompileInstruction(
			loopIndex,
			{
				lineNumber: 10,
				instruction: 'loopIndex',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).toEqual([...localGet(3), ...i32const(1), WASM_I32_SUB]);
		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: false }]);
	});

	it('uses the innermost loop when nested', () => {
		const outerLoopCounterLocal = { kind: 'value', valueType: 'int', index: 1 };
		const innerLoopCounterLocal = { kind: 'value', valueType: 'int', index: 2 };
		const context = createInstructionCompilerTestContext({
			locals: {
				__outer: outerLoopCounterLocal,
				__inner: innerLoopCounterLocal,
			},
			blockStack: [
				{
					blockType: BlockType.MODULE,
					expectedResultTypes: [],
				},
				{
					blockType: BlockType.LOOP,
					expectedResultTypes: [],
					loopCounterLocalName: '__outer',
					loopCounterLocal: outerLoopCounterLocal,
				},
				{
					blockType: BlockType.LOOP,
					expectedResultTypes: [],
					loopCounterLocalName: '__inner',
					loopCounterLocal: innerLoopCounterLocal,
				},
			],
		});

		analyzeAndCompileInstruction(
			loopIndex,
			{
				lineNumber: 10,
				instruction: 'loopIndex',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).toEqual([...localGet(2), ...i32const(1), WASM_I32_SUB]);
	});
});
