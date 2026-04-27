import { compileSegment } from '../compiler';
import { allocateInternalResource } from '../utils/internalResources';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `risingEdge`.
 * @see [Instruction docs](../../docs/instructions/signal-helpers.md)
 */
const risingEdge: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation with minOperands: 1 guarantees at least 1 operand exists on the stack
		const operand = context.stack.pop()!;

		const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
		const currentValueName = '__risingEdgeDetector_currentValue' + lineNumberAfterMacroExpansion;
		const previousValueName = '__risingEdgeDetector_previousValue' + lineNumberAfterMacroExpansion;
		const memoryType = operand.isInteger ? 'int' : 'float';
		const loadInstruction = operand.isInteger ? 'load' : 'loadFloat';
		const previousValue = allocateInternalResource(context, previousValueName, memoryType);

		// Restore the operand for the segment so type checks apply to the original value.
		context.stack.push(operand);

		// compileSegment is used here because this instruction spans multiple memory accesses
		// and conditional branches; the control-flow structure genuinely benefits from
		// composed instruction semantics.
		return compileSegment(
			[
				`local ${memoryType} ${currentValueName}`,
				`localSet ${currentValueName}`,
				`push ${currentValueName}`,
				`push ${previousValue.byteAddress}`,
				loadInstruction,
				'greaterThan',
				'if',
				'push 1',
				'else',
				'push 0',
				'ifEnd int',
				`push ${previousValue.byteAddress}`,
				`push ${currentValueName}`,
				'store',
			],
			context
		);
	}
);

export default risingEdge;
