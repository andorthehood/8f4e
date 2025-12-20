import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const dup: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		const tempName = '__dupTemp' + line.lineNumber;

		context.stack.push(operand);

		return compileSegment(
			[
				`local ${operand.isInteger ? 'int' : 'float'} ${tempName}`,
				`localSet ${tempName}`,
				`localGet ${tempName}`,
				`localGet ${tempName}`,
			],
			context
		);
	}
);

export default dup;
