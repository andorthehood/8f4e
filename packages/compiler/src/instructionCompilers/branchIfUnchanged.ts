import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `branchIfUnchanged`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const branchIfUnchanged: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push(operand);

		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type !== ArgumentType.LITERAL) {
			throw getError(ErrorCode.EXPECTED_VALUE, line, context);
		}

		const depth = line.arguments[0].value;
		const type = operand.isInteger ? 'int' : 'float';
		const previousValueMemoryName = '__branchIfUnchanged_previousValue' + line.lineNumber;
		const currentValueMemoryName = '__branchIfUnchanged_currentValue' + line.lineNumber;

		return compileSegment(
			[
				`${type} ${previousValueMemoryName} 0`,
				`local ${type} ${currentValueMemoryName}`,

				`localSet ${currentValueMemoryName} `,

				`push ${previousValueMemoryName}`,
				`localGet ${currentValueMemoryName}`,
				'equal',
				`branchIfTrue ${depth}`,

				`push &${previousValueMemoryName}`,
				`localGet ${currentValueMemoryName}`,
				'store',
			],
			context
		);
	}
);

export default branchIfUnchanged;
