import { inferErrorCodeFromRule } from './inferErrorCodeFromRule';

import { getError } from '../compilerError';
import { areAllOperandsFloats, areAllOperandsIntegers } from '../utils/operandTypes';

import type { CompilationContext, InstructionCompiler, StackItem } from '@8f4e/compiler-types';
import type { OperandRule } from './types';

export function validateOperandTypes(
	operands: StackItem[],
	rule: OperandRule | OperandRule[],
	line: Parameters<InstructionCompiler>[0],
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
	}
}
