import { ArgumentType } from '../types';
import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { allocateInternalResource } from '../utils/internalResources';

import type { AST, BranchIfUnchangedLine, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `branchIfUnchanged`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branchIfUnchanged: InstructionCompiler<BranchIfUnchangedLine> = withValidation<BranchIfUnchangedLine>(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line: BranchIfUnchangedLine, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push(operand);

		const depth = line.arguments[0].value;
		const type = operand.isInteger ? 'int' : 'float';
		const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
		const previousValueMemoryName = '__branchIfUnchanged_previousValue' + lineNumberAfterMacroExpansion;
		const currentValueMemoryName = '__branchIfUnchanged_currentValue' + lineNumberAfterMacroExpansion;
		const previousValue = allocateInternalResource(context, previousValueMemoryName, type);

		return compileSegment(
			[
				`local ${type} ${currentValueMemoryName}`,

				`localSet ${currentValueMemoryName} `,

				`push ${previousValue.byteAddress}`,
				operand.isInteger ? 'load' : 'loadFloat',
				`push ${currentValueMemoryName}`,
				'equal',
				`branchIfTrue ${depth}`,

				`push ${previousValue.byteAddress}`,
				`push ${currentValueMemoryName}`,
				'store',
			],
			context
		);
	}
);

export default branchIfUnchanged;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('branchIfUnchanged instruction compiler', () => {
		it('compiles the unchanged check segment', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true });

			branchIfUnchanged(
				{
					lineNumberBeforeMacroExpansion: 4,
					lineNumberAfterMacroExpansion: 4,
					instruction: 'branchIfUnchanged',
					arguments: [{ type: ArgumentType.LITERAL, value: 1, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
				memory: context.namespace.memory,
				locals: context.locals,
			}).toMatchSnapshot();
		});
	});
}
