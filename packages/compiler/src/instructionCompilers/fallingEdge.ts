import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const fallingEdge: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation with minOperands: 1 guarantees at least 1 operand exists on the stack
		context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: false });

		const currentValueName = '__fallingEdgeDetector_currentValue' + line.lineNumber;
		const previousValueName = '__fallingEdgeDetector_previousValue' + line.lineNumber;

		return compileSegment(
			[
				`int ${previousValueName} 0`,
				`local int ${currentValueName}`,
				`localSet ${currentValueName}`,
				`localGet ${currentValueName}`,
				`push &${previousValueName}`,
				'load',
				'lessThan',
				'if int',
				'push 1',
				'else',
				'push 0',
				'ifEnd',
				`push &${previousValueName}`,
				`localGet ${currentValueName}`,
				'store',
			],
			context
		);
	}
);

export default fallingEdge;
