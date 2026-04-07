import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { allocateInternalResource } from '../utils/internalResources';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `hasChanged`.
 * @see [Instruction docs](../../docs/instructions/signal-helpers.md)
 */
const hasChanged: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
	},
	(line, context) => {
		const operand = context.stack.pop()!;

		const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
		const currentValueName = '__hasChangedDetector_currentValue' + lineNumberAfterMacroExpansion;
		const previousValueName = '__hasChangedDetector_previousValue' + lineNumberAfterMacroExpansion;
		const memoryType = operand.isInteger ? 'int' : 'float';
		const previousValue = allocateInternalResource(context, previousValueName, memoryType);

		context.stack.push({ isInteger: operand.isInteger, isNonZero: false });

		return compileSegment(
			[
				`local ${memoryType} ${currentValueName}`,
				`localSet ${currentValueName}`,
				`push ${previousValue.byteAddress}`,
				operand.isInteger ? 'load' : 'loadFloat',
				`push ${currentValueName}`,
				'equal',
				'equalToZero',
				`push ${previousValue.byteAddress}`,
				`push ${currentValueName}`,
				'store',
			],
			context
		);
	}
);

export default hasChanged;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasChanged instruction compiler', () => {
		it('compiles the change detector segment', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false });

			hasChanged(
				{
					lineNumberBeforeMacroExpansion: 3,
					lineNumberAfterMacroExpansion: 3,
					instruction: 'hasChanged',
					arguments: [],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				memory: context.namespace.memory,
				locals: context.locals,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
