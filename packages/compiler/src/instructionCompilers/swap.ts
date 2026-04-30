import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `swap`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const swap: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
	},
	(line, context) => {
		// Non-null assertions are safe: withValidation ensures 2 operands exist
		const operand1 = context.stack.pop()!;
		const operand2 = context.stack.pop()!;

		const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
		const tempAName = '__swapTempA' + lineNumberAfterMacroExpansion;
		const tempBName = '__swapTempB' + lineNumberAfterMacroExpansion;

		context.stack.push(operand2);
		context.stack.push(operand1);

		return compileSegment(
			// compileSegment is needed here because `local` declarations require
			// semantic pipeline processing to allocate both local variable indices.
			[
				`local ${operand1.isInteger ? 'int' : 'float'} ${tempAName}`,
				`local ${operand2.isInteger ? 'int' : 'float'} ${tempBName}`,
				`localSet ${tempAName}`,
				`localSet ${tempBName}`,
				`push ${tempAName}`,
				`push ${tempBName}`,
			],
			context
		);
	}
);

export default swap;
