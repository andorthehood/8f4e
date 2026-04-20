import { ArgumentType, type ConstLine } from '@8f4e/tokenizer';

import { getLayoutDependentReference } from './getLayoutDependentReference';
import { normalizeArgumentsAtIndexes } from './normalizeArgumentsAtIndexes';

import { getError } from '../getError';
import { SymbolResolutionErrorCode, type SymbolResolutionContext } from '../types';

export function normalizeConst(line: ConstLine, context: SymbolResolutionContext): ConstLine {
	const layoutDependentReference = getLayoutDependentReference(line.arguments[1]);
	if (layoutDependentReference) {
		throw getError(SymbolResolutionErrorCode.LAYOUT_DEPENDENT_CONSTANT, line, context, {
			identifier: layoutDependentReference,
		});
	}

	const { line: result } = normalizeArgumentsAtIndexes(line, context, [1]);
	const valueArg = result.arguments[1];
	if (valueArg.type !== ArgumentType.LITERAL) {
		const identifier =
			valueArg.type === ArgumentType.COMPILE_TIME_EXPRESSION
				? `${valueArg.left.value}${valueArg.operator}${valueArg.right.value}`
				: String(valueArg.value);
		throw getError(SymbolResolutionErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier });
	}
	return result as ConstLine;
}
