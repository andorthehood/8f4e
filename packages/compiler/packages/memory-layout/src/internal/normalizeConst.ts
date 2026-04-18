import { ArgumentType, type ConstLine } from '@8f4e/tokenizer';

import { normalizeArgumentsAtIndexes } from './normalizeArgumentsAtIndexes';

import { getError } from '../getError';
import { ErrorCode, type PublicMemoryLayoutContext } from '../types';

export function normalizeConst(line: ConstLine, context: PublicMemoryLayoutContext): ConstLine {
	const { line: result } = normalizeArgumentsAtIndexes(line, context, [1]);
	const valueArg = result.arguments[1];
	if (valueArg.type !== ArgumentType.LITERAL) {
		const identifier =
			valueArg.type === ArgumentType.COMPILE_TIME_EXPRESSION
				? `${valueArg.left.value}${valueArg.operator}${valueArg.right.value}`
				: String(valueArg.value);
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier });
	}
	return result as ConstLine;
}
