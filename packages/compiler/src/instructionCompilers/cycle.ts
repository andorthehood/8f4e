import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `cycle`.
 * @see [Instruction docs](../../docs/instructions/signal-helpers.md)
 */
const cycle: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 3,
		operandTypes: 'int',
	},
	(line, context) => {
		// Pop 3 operands: end position, start position, pointer (in reverse order)
		context.stack.pop();
		context.stack.pop();
		context.stack.pop();

		context.stack.push({ isInteger: true, isNonZero: false });
		context.stack.push({ isInteger: true, isNonZero: false });
		context.stack.push({ isInteger: true, isNonZero: false });

		const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
		const pointerName = '__pointerCycle_pointerToIncrement' + lineNumberAfterMacroExpansion;
		const startPositionName = '__pointerCycle_startPosition' + lineNumberAfterMacroExpansion;
		const endPositionName = '__pointerCycle_endPosition' + lineNumberAfterMacroExpansion;

		return compileSegment(
			[
				`local int ${pointerName}`,
				`local int ${startPositionName}`,
				`local int ${endPositionName}`,

				`localSet ${endPositionName}`,
				`localSet ${startPositionName}`,
				`localSet ${pointerName}`,

				`push ${pointerName}`,
				`push ${pointerName}`,
				`load`,
				`push ${GLOBAL_ALIGNMENT_BOUNDARY}`,
				'add',
				'store',

				`push ${pointerName}`,
				'load',
				`push ${endPositionName}`,
				'greaterThan',
				'if',
				` push ${pointerName}`,
				` push ${startPositionName}`,
				` store`,
				'ifEnd',
			],
			context
		);
	}
);

export default cycle;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('cycle instruction compiler', () => {
		it('compiles the cycle segment', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push(
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false }
			);

			cycle(
				{
					lineNumberBeforeMacroExpansion: 2,
					lineNumberAfterMacroExpansion: 2,
					instruction: 'cycle',
					arguments: [],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				locals: context.locals,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
