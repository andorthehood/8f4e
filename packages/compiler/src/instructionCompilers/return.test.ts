import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { BlockType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import { validateInstruction } from '../stackAnalysis/validateInstruction';
import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import _return from './return';

describe('return instruction compiler', () => {
	it('emits WASM return opcode and clears the stack', () => {
		const context = createInstructionCompilerTestContext({
			blockStack: [
				...createInstructionCompilerTestContext().blockStack,
				{
					blockType: BlockType.FUNCTION,expectedResultTypes: [],
				},
			],
		});
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: false });

		analyzeAndCompileInstruction(
			_return,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'return',
				arguments: [],
			} as CompilerASTLine,
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
		} as CompilerASTLine;

		expect(() => {
			validateInstruction(line, context);
		}).toThrowError();
	});
});
