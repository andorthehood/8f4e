import type { CompilationContext, CompilerASTLine, OperandRule, StackItem } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';
import { areAllOperandsFloats, areAllOperandsIntegers, hasMixedFloatWidth } from '../utils/operandTypes';
import { inferErrorCodeFromRule } from './inferErrorCodeFromRule';

export function validateOperandTypes(
	operands: StackItem[],
	rule: OperandRule | OperandRule[],
	line: CompilerASTLine,
	context: CompilationContext
): void {
	const errorCode = inferErrorCodeFromRule(rule);

	if (Array.isArray(rule)) {
		for (let i = 0; i < rule.length && i < operands.length; i++) {
			const operand = operands[i];
			const expectedType = rule[i];

			if (expectedType === 'int' && operand.valueType !== 'int') {
				throw getError(errorCode, line, context);
			} else if (expectedType === 'float' && operand.valueType === 'int') {
				throw getError(errorCode, line, context);
			}
		}
	} else if (rule === 'int') {
		if (!areAllOperandsIntegers(...operands)) {
			throw getError(errorCode, line, context);
		}
	} else if (rule === 'float') {
		if (!areAllOperandsFloats(...operands)) {
			throw getError(errorCode, line, context);
		}
	} else if (rule === 'matching') {
		if (!areAllOperandsIntegers(...operands) && !areAllOperandsFloats(...operands)) {
			throw getError(errorCode, line, context);
		}

		if (hasMixedFloatWidth(...operands)) {
			throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
		}
	}
}
