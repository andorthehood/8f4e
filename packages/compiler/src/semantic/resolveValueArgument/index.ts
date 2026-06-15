import type { Argument, CompilationContext, CompileTimeOperand, Const } from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import { evaluateResolvedValueExpression } from './evaluateResolvedValueExpression';
import { resolveMemoryExpressionOperand } from './resolveMemoryExpressionOperand';

function resolveValueOperand(operand: CompileTimeOperand, context: CompilationContext): Const | undefined {
	if (operand.type === ArgumentType.LITERAL) {
		return {
			value: operand.value,
			isInteger: operand.isInteger,
			...(operand.isFloat64 ? { isFloat64: true } : {}),
		};
	}

	return resolveMemoryExpressionOperand(operand, context);
}

/**
 * Attempts to fold an argument into a semantic value using the current context.
 * This is the composition point for memory/layout expressions such as sizeof(...),
 * count(...), and address references. Constant identifiers are expected to be
 * inlined before semantic normalization reaches this resolver.
 *
 * @param context - Compilation context used by the operation.
 * @param argument - Argument whose resolved value or metadata should be used.
 * @returns Resolved value, or `undefined` when the argument cannot be folded.
 */
export function tryResolveValueArgument(context: CompilationContext, argument: Argument): Const | undefined {
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return undefined;
	}

	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const leftConst = resolveValueOperand(argument.left, context);
		const rightConst = resolveValueOperand(argument.right, context);

		if (leftConst === undefined || rightConst === undefined) {
			return undefined;
		}

		if (argument.operator === '/' && rightConst.value === 0) {
			return undefined;
		}

		return evaluateResolvedValueExpression(leftConst, rightConst, argument.operator);
	}

	return resolveValueOperand(argument, context);
}
