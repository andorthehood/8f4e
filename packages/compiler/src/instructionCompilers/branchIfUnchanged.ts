import { compileSegment } from '../compiler';
import { allocateInternalResource } from '../utils/internalResources';
import { withValidation } from '../withValidation';

import type { BranchIfUnchangedLine, InstructionCompiler } from '../types';

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
