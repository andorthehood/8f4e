import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const risingEdge: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: false });

		const currentValueName = '__risingEdgeDetector_currentValue' + line.lineNumber;
		const previousValueName = '__risingEdgeDetector_previousValue' + line.lineNumber;

		return compileSegment(
			[
				`int ${previousValueName} 0`,
				`local int ${currentValueName}`,
				`localSet ${currentValueName}`,
				`localGet ${currentValueName}`,
				`push &${previousValueName}`,
				'load',
				'greaterThan',
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

export default risingEdge;
