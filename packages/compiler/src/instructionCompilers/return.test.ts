import { describe, expect, it } from 'vitest';
import { BlockType } from '@8f4e/compiler-spec';

import _return from './return';

import { validateInstruction } from '../stackAnalysis/validateInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('return instruction compiler', () => {
	it('emits WASM return opcode and clears the stack', () => {
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

		expect({
			byteCode: context.byteCode,
			stack: context.stack,
		}).toMatchSnapshot();
	});

	it('throws when used outside a function', () => {
		const context = createInstructionCompilerTestContext();
		// default context has MODULE block, not FUNCTION
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'return',
			arguments: [],
		} as AST[number];

		expect(() => {
			validateInstruction(line, context);
		}).toThrowError();
	});
});
