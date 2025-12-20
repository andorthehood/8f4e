import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

const cycle: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 3,
		operandTypes: 'int',
	},
	(line, context) => {
		// Pop 3 operands: end position, start position, pointer (in reverse order)
		context.stack.pop();
		context.stack.pop();
		context.stack.pop();

		context.stack.push({ isInteger: true, isNonZero: false });
		context.stack.push({ isInteger: true, isNonZero: false });
		context.stack.push({ isInteger: true, isNonZero: false });

		const pointerName = '__pointerCycle_pointerToIncrement' + line.lineNumber;
		const startPositionName = '__pointerCycle_startPosition' + line.lineNumber;
		const endPositionName = '__pointerCycle_endPosition' + line.lineNumber;

		return compileSegment(
			[
				`local int ${pointerName}`,
				`local int ${startPositionName}`,
				`local int ${endPositionName}`,

				`localSet ${endPositionName}`,
				`localSet ${startPositionName}`,
				`localSet ${pointerName}`,

				`localGet ${pointerName}`,
				`localGet ${pointerName}`,
				`load`,
				'push WORD_SIZE',
				'add',
				'store',

				`localGet ${pointerName}`,
				'load',
				`localGet ${endPositionName}`,
				'greaterThan',
				'if void',
				` localGet ${pointerName}`,
				` localGet ${startPositionName}`,
				` store`,
				'ifEnd',
			],
			context
		);
	}
);

export default cycle;
