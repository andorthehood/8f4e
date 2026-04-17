import { describe, expect, it } from 'vitest';

import storeBytes from './storeBytes';

import { ArgumentType } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('storeBytes instruction compiler', () => {
	it('throws INSUFFICIENT_OPERANDS when stack has fewer than count+1 items', () => {
		const context = createInstructionCompilerTestContext();
		// Only 2 items on stack but count=3 requires 4
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		expect(() => {
			storeBytes(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'storeBytes',
					arguments: [{ type: ArgumentType.LITERAL, value: 3, isInteger: true }],
				} as AST[number],
				context
			);
		}).toThrow();
	});

	it('compiles storeBytes 3 and leaves an empty stack', () => {
		const context = createInstructionCompilerTestContext();
		// bytes pushed first, addr pushed last (on top)
		context.stack.push(
			{ isInteger: true, isNonZero: false },
			{ isInteger: true, isNonZero: false },
			{ isInteger: true, isNonZero: false },
			{ isInteger: true, isNonZero: false, isSafeMemoryAddress: true }
		);

		storeBytes(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'storeBytes',
				arguments: [{ type: ArgumentType.LITERAL, value: 3, isInteger: true }],
			} as AST[number],
			context
		);

		expect(context.stack).toHaveLength(0);
	});

	it('emits i32.store8 opcode (0x3a = 58) for each byte', () => {
		const context = createInstructionCompilerTestContext();
		// bytes pushed first, addr pushed last (on top)
		context.stack.push(
			{ isInteger: true, isNonZero: false },
			{ isInteger: true, isNonZero: false },
			{ isInteger: true, isNonZero: false, isSafeMemoryAddress: true }
		);

		storeBytes(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'storeBytes',
				arguments: [{ type: ArgumentType.LITERAL, value: 2, isInteger: true }],
			} as AST[number],
			context
		);

		expect(context.byteCode.filter(b => b === 0x3a)).toHaveLength(2);
	});

	it('compiles storeBytes 0 (address-only pop) and leaves an empty stack', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: false,
			isSafeMemoryAddress: true,
		});

		storeBytes(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'storeBytes',
				arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
			} as AST[number],
			context
		);

		expect(context.stack).toHaveLength(0);
	});
});
