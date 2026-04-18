import { ArgumentType, type Argument } from '@8f4e/tokenizer';

import { tryResolveCompileTimeArgument } from './tryResolveCompileTimeArgument';

import type { PublicMemoryLayoutContext } from '../types';

export function normalizeArgument(argument: Argument, context: PublicMemoryLayoutContext): Argument {
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	const resolved = tryResolveCompileTimeArgument(context, argument);
	if (!resolved) {
		return argument;
	}

	return {
		type: ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
	};
}
