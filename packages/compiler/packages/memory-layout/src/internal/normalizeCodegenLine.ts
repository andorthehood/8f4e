import { ArgumentType, type AST } from '@8f4e/tokenizer';

import { normalizeArgumentsAtIndexes } from './normalizeArgumentsAtIndexes';
import { validateIntermoduleAddressReference } from './validateIntermoduleAddressReference';
import { validateOrDeferCompileTimeExpression } from './validateOrDeferCompileTimeExpression';
import { validateOrDeferUnresolvedIdentifier } from './validateOrDeferUnresolvedIdentifier';
import { isIntermoduleReferenceKind } from './isIntermoduleReferenceKind';

import { ErrorCode, type PublicMemoryLayoutContext } from '../internalTypes';
import { getError } from '../getError';
import { isMemoryIdentifier } from '../memory-data/isMemoryIdentifier';

export function normalizeCodegenLine(line: AST[number], context: PublicMemoryLayoutContext): AST[number] {
	if (line.instruction === 'default') {
		const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0]);
		const argument = normalized.arguments[0];

		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
			if (deferred) {
				return normalized;
			}
		}

		if (argument?.type === ArgumentType.IDENTIFIER) {
			const deferred = validateOrDeferUnresolvedIdentifier(argument, line, context);
			if (deferred) {
				return normalized;
			}
		}

		return normalized;
	}

	if (line.instruction === 'map') {
		const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0, 1]);

		for (const index of [0, 1]) {
			const argument = normalized.arguments[index];

			if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
				const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
				if (deferred) {
					continue;
				}
			}

			if (argument?.type === ArgumentType.IDENTIFIER) {
				const deferred = validateOrDeferUnresolvedIdentifier(argument, line, context);
				if (deferred) {
					continue;
				}
			}
		}

		return normalized;
	}

	if (line.instruction === 'push') {
		const { line: normalized } = normalizeArgumentsAtIndexes(line, context, [0]);
		const argument = normalized.arguments[0];

		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
			if (deferred) {
				return normalized;
			}
		}

		if (argument?.type === ArgumentType.IDENTIFIER) {
			const { value, referenceKind } = argument;
			const { memory } = context.namespace;
			const isIntermodule = isIntermoduleReferenceKind(referenceKind);

			validateIntermoduleAddressReference(argument, line, context);
			if (isIntermodule) {
				return normalized;
			}

			if (referenceKind === 'plain') {
				return normalized;
			}

			if (referenceKind === 'memory-pointer' && isMemoryIdentifier(memory, argument.targetMemoryId)) {
				return normalized;
			}

			if (referenceKind === 'memory-reference' && value === 'this') {
				return normalized;
			}

			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: value });
		}

		return normalized;
	}

	return line;
}
