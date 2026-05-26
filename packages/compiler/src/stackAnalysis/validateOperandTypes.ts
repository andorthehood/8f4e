import { ErrorCode } from '@8f4e/compiler-spec';

import { inferErrorCodeFromRule } from './inferErrorCodeFromRule';

import { getError } from '../compilerError';
import { areAllOperandsFloats, areAllOperandsIntegers, hasMixedFloatWidth } from '../utils/operandTypes';

import type { CompilerASTLine, CompilationContext, OperandRule, StackItem } from '@8f4e/compiler-spec';

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

			if (expectedType === 'int' && !operand.isInteger) {
				throw getError(errorCode, line, context);
			} else if (expectedType === 'float' && operand.isInteger) {
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
