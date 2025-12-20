import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const swap: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
	},
	(line, context) => {
		// Non-null assertions are safe: withValidation ensures 2 operands exist
		const operand1 = context.stack.pop()!;
		const operand2 = context.stack.pop()!;

		const tempAName = '__swapTempA' + line.lineNumber;
		const tempBName = '__swapTempB' + line.lineNumber;

		context.stack.push(operand2);
		context.stack.push(operand1);

		return compileSegment(
			[
				`local ${operand1.isInteger ? 'int' : 'float'} ${tempAName}`,
				`local ${operand2.isInteger ? 'int' : 'float'} ${tempBName}`,
				`localSet ${tempAName}`,
				`localSet ${tempBName}`,
				`localGet ${tempAName}`,
				`localGet ${tempBName}`,
			],
			context
		);
	}
);

export default swap;
