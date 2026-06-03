import type { Argument, CompilationContext, Const } from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import { evaluateConstantExpression } from './evaluateConstantExpression';
import { resolveCompileTimeOperand } from './resolveCompileTimeOperand';

/**
 * Attempts to fold an argument into a compile-time constant using the current semantic context.
 *
 * @param context - Current compiler context consulted or updated by the operation.
 * @param argument - Argument whose resolved value or metadata should be used.
 * @returns Resolved compile-time constant, or `undefined` when the argument cannot be folded.
 */
export function tryResolveCompileTimeArgument(context: CompilationContext, argument: Argument): Const | undefined {
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const leftConst = resolveCompileTimeOperand(argument.left, context);
		const rightConst = resolveCompileTimeOperand(argument.right, context);

		if (leftConst === undefined || rightConst === undefined) {
			return undefined;
		}

		if (argument.operator === '/' && rightConst.value === 0) {
			return undefined;
		}

		return evaluateConstantExpression(leftConst, rightConst, argument.operator);
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return undefined;
	}

	return resolveCompileTimeOperand(argument, context);
}
