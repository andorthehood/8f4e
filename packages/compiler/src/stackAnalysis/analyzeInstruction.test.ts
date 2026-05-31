import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { ArgumentType, ErrorCode } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext from '../utils/testUtils';
import { analyzeInstruction } from './analyzeInstruction';

describe('analyzeInstruction', () => {
	it('records stack before, consumed operands, produced items, and stack after', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: true }
		);

		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'add',
			arguments: [],
		} as CompilerASTLine;

		const analyzedLine = analyzeInstruction(line, context);

		expect(analyzedLine.stackAnalysis).toEqual({
			stackBefore: [
				{ kind: 'value', valueType: 'int', isNonZero: false },
				{ kind: 'value', valueType: 'int', isNonZero: true },
			],
			consumedOperands: [
				{ kind: 'value', valueType: 'int', isNonZero: false },
				{ kind: 'value', valueType: 'int', isNonZero: true },
			],
			producedStackItems: [{ kind: 'value', valueType: 'int', isNonZero: false }],
			stackAfter: [{ kind: 'value', valueType: 'int', isNonZero: false }],
		});
		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: false }]);
	});

	it('owns stack errors before codegen runs', () => {
		const context = createInstructionCompilerTestContext();
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'add',
			arguments: [],
		} as CompilerASTLine;

		expect(() => analyzeInstruction(line, context)).toThrow(`${ErrorCode.INSUFFICIENT_OPERANDS}`);
	});

	it('records push-produced stack metadata', () => {
		const context = createInstructionCompilerTestContext();
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [{ type: ArgumentType.LITERAL, value: 7, isInteger: true }],
		} as CompilerASTLine;

		const analyzedLine = analyzeInstruction(line, context);

		expect(analyzedLine.stackAnalysis.producedStackItems).toEqual([
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 7 },
		]);
		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 7 }]);
	});
});
