import type { CompilationContext, CompilerASTLine, OperandRule, StackItem } from '@8f4e/compiler-spec';
import { ErrorCode, getError } from '@8f4e/compiler-spec';
import { inferErrorCodeFromRule } from './inferErrorCodeFromRule';
import { areAllOperandsFloats, areAllOperandsIntegers, hasMixedFloatWidth } from './utils/operandTypes';

/**
 * Enforces operand type rules from the instruction spec against already-peeked stack operands.
 *
 * @param operands - Stack operands to inspect.
 * @param rule - Operand rule from the compiler spec.
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
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
