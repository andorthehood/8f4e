import { ArgumentType, type Argument } from '@8f4e/tokenizer';

import { evaluateConstantExpression } from './evaluateConstantExpression';
import { resolveCompileTimeOperand } from './resolveCompileTimeOperand';

import type { Const, SymbolResolutionContext } from '../types';

export function tryResolveCompileTimeArgument(context: SymbolResolutionContext, argument: Argument): Const | undefined {
	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const leftConst = resolveCompileTimeOperand(argument.left, context);
		const rightConst = resolveCompileTimeOperand(argument.right, context);

		if (leftConst === undefined || rightConst === undefined || (argument.operator === '/' && rightConst.value === 0)) {
			return undefined;
		}

		return evaluateConstantExpression(leftConst, rightConst, argument.operator);
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return undefined;
	}

	return resolveCompileTimeOperand(argument, context);
}
