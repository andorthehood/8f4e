import { ArgumentType, type ConstLine } from '@8f4e/tokenizer';

import { getError } from '../getError';
import { ErrorCode, type PublicMemoryLayoutContext } from '../types';

export function semanticConst(line: ConstLine, context: PublicMemoryLayoutContext) {
	const constName = line.arguments[0].value;
	const constValue = line.arguments[1];
	if (constValue.type !== ArgumentType.LITERAL) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: '' });
	}
	context.namespace.consts[constName] = {
		value: constValue.value,
		isInteger: constValue.isInteger,
		...(constValue.isFloat64 ? { isFloat64: true } : {}),
	};
}
