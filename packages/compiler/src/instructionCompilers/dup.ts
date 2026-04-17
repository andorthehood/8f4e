import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `dup`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const dup: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		const tempName = '__dupTemp' + line.lineNumberAfterMacroExpansion;

		context.stack.push(operand);
		const localType = operand.isInteger ? 'int' : operand.isFloat64 ? 'float64' : 'float';

		return compileSegment(
			[`local ${localType} ${tempName}`, `localSet ${tempName}`, `push ${tempName}`, `push ${tempName}`],
			context
		);
	}
);

export default dup;
