import { compileSegment } from '../compiler';
import { ErrorCode, getError } from '../compilerError';
import { areAllOperandsFloat64, areAllOperandsIntegers, hasMixedFloatWidth } from '../utils/operandTypes';
import { withValidation } from '../withValidation';

import type { FunctionValueType, InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `clamp`.
 * Stack order: value, minimum, maximum.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const clamp: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 3,
		operandTypes: 'matching',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 3 operands exist
		const maximum = context.stack.pop()!;
		const minimum = context.stack.pop()!;
		const value = context.stack.pop()!;

		if (hasMixedFloatWidth(value, minimum, maximum)) {
			throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
		}

		const isInteger = areAllOperandsIntegers(value, minimum, maximum);
		const isFloat64 = areAllOperandsFloat64(value, minimum, maximum);
		const valueType: FunctionValueType = isInteger ? 'int' : isFloat64 ? 'float64' : 'float';
		const valueName = `__clamp_value${line.lineNumberAfterMacroExpansion}`;
		const minName = `__clamp_min${line.lineNumberAfterMacroExpansion}`;
		const maxName = `__clamp_max${line.lineNumberAfterMacroExpansion}`;

		context.stack.push(value, minimum, maximum);

		if (isInteger) {
			return compileSegment(
				[
					`local ${valueType} ${valueName}`,
					`local ${valueType} ${minName}`,
					`local ${valueType} ${maxName}`,
					`localSet ${maxName}`,
					`localSet ${minName}`,
					`localSet ${valueName}`,
					`push ${valueName}`,
					`push ${minName}`,
					'lessThan',
					'if',
					` push ${minName}`,
					'else',
					` push ${valueName}`,
					` push ${maxName}`,
					' greaterThan',
					' if',
					`  push ${maxName}`,
					' else',
					`  push ${valueName}`,
					' ifEnd int',
					'ifEnd int',
				],
				context
			);
		}

		return compileSegment(
			[
				`local ${valueType} ${valueName}`,
				`local ${valueType} ${minName}`,
				`local ${valueType} ${maxName}`,
				`localSet ${maxName}`,
				`localSet ${minName}`,
				`localSet ${valueName}`,
				`push ${valueName}`,
				`push ${minName}`,
				'max',
				`push ${maxName}`,
				'min',
			],
			context
		);
	}
);

export default clamp;
