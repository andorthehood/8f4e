import { describe, expect, it } from 'vitest';
import { ArgumentType, ErrorCode } from '@8f4e/compiler-spec';

import { analyzeInstruction } from './analyzeInstruction';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('analyzeInstruction', () => {
	it('records stack before, consumed operands, produced items, and stack after', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: true });

		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'add',
			arguments: [],
		} as AST[number];

		const analyzedLine = analyzeInstruction(line, context);

		expect(analyzedLine.stackAnalysis).toEqual({
			stackBefore: [
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: true },
			],
			consumedOperands: [
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: true },
			],
			producedStackItems: [{ isInteger: true, isNonZero: false }],
			stackAfter: [{ isInteger: true, isNonZero: false }],
		});
		expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
	});

	it('owns stack errors before codegen runs', () => {
		const context = createInstructionCompilerTestContext();
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'add',
			arguments: [],
		} as AST[number];

		expect(() => analyzeInstruction(line, context)).toThrow(`${ErrorCode.INSUFFICIENT_OPERANDS}`);
	});

	it('records push-produced stack metadata', () => {
		const context = createInstructionCompilerTestContext();
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [{ type: ArgumentType.LITERAL, value: 7, isInteger: true }],
		} as AST[number];

		const analyzedLine = analyzeInstruction(line, context);

		expect(analyzedLine.stackAnalysis.producedStackItems).toEqual([
			{ isInteger: true, isNonZero: true, knownIntegerValue: 7 },
		]);
		expect(context.stack).toEqual([{ isInteger: true, isNonZero: true, knownIntegerValue: 7 }]);
	});
});
