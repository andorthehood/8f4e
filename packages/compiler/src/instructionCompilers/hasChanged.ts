import { compileSegment } from '../compiler';
import { allocateInternalResource } from '../utils/internalResources';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

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

		// compileSegment is used here because hasChanged combines a memory load,
		// equality check, logical inversion, and memory store; this multi-step
		// pattern genuinely benefits from composed instruction semantics.
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
