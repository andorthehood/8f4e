import { ArgumentType, type AST } from '@8f4e/tokenizer';

import { normalizeArgumentsAtIndexes } from './normalizeArgumentsAtIndexes';
import { validateIntermoduleAddressReference } from './validateIntermoduleAddressReference';
import { validateOrDeferCompileTimeExpression } from './validateOrDeferCompileTimeExpression';
import { validateOrDeferUnresolvedIdentifier } from './validateOrDeferUnresolvedIdentifier';

import { ErrorCode, type PublicMemoryLayoutContext } from '../internalTypes';
import { getError } from '../getError';

export function normalizeMemoryDeclaration(line: AST[number], context: PublicMemoryLayoutContext): AST[number] {
	let { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0, 1]);

	for (const index of [0, 1]) {
		const argument = normalized.arguments[index];
		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
			if (deferred) {
				continue;
			}
		}
		if (index === 1 && argument?.type === ArgumentType.IDENTIFIER) {
			validateIntermoduleAddressReference(argument, line, context);
			if (
				argument.referenceKind === 'intermodular-module-reference' ||
				argument.referenceKind === 'intermodular-reference'
			) {
				normalized = { ...normalized, arguments: [normalized.arguments[0]] };
			}
		}
	}

	if (line.instruction.endsWith('[]')) {
		const elementCountArg = normalized.arguments[1];
		if (elementCountArg?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			const deferred = validateOrDeferCompileTimeExpression(elementCountArg, line, context);
			if (deferred) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
					identifier: `${elementCountArg.left.value}${elementCountArg.operator}${elementCountArg.right.value}`,
				});
			}
		}
		if (elementCountArg?.type === ArgumentType.IDENTIFIER) {
			const deferred = validateOrDeferUnresolvedIdentifier(elementCountArg, line, context);
			if (deferred) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: elementCountArg.value });
			}
		}
	}

	return normalized;
}
