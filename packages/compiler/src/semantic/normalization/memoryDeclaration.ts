import {
	validateIntermoduleAddressReference,
	validateOrDeferCompileTimeExpression,
	validateOrDeferUnresolvedIdentifier,
	normalizeArgumentsAtIndexes,
} from './helpers';

import { ArgumentType, type AST, type CompilationContext } from '../../types';
import { ErrorCode, getError } from '../../compilerError';

/**
 * Normalizes compile-time arguments for memory declaration instructions
 * (int, float, float64, array types, pointer types, etc.).
 * Scalar declarations normalize the name/default slots; array declarations normalize
 * the element-count slot and all inline initializer values.
 * Validates intermodule references in default/initializer values if present.
 */
export default function normalizeMemoryDeclaration(line: AST[number], context: CompilationContext): AST[number] {
	const isArrayDeclaration = line.instruction.endsWith('[]');
	const normalizeIndexes = isArrayDeclaration
		? line.arguments.map((_, index) => index).filter(index => index > 0)
		: [0, 1];
	let { line: normalized } = normalizeArgumentsAtIndexes(line, context, normalizeIndexes);

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

			// If the argument could not be folded to a literal (referenceKind is an address-style
			// intermodule ref whose target module has not yet been laid out), strip the default
			// from the line. The deferred state is owned here rather than relying on
			// parseMemoryInstructionArguments to fabricate a placeholder 0.
			if (
				!isArrayDeclaration &&
				(argument.referenceKind === 'intermodular-module-reference' ||
					argument.referenceKind === 'intermodular-reference')
			) {
				normalized = { ...normalized, arguments: [normalized.arguments[0]] };
			}
		}
	}

	if (isArrayDeclaration) {
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

		for (let index = 2; index < normalized.arguments.length; index++) {
			const initializerArg = normalized.arguments[index];
			if (initializerArg?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
				const deferred = validateOrDeferCompileTimeExpression(initializerArg, line, context);
				if (deferred) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
						identifier: `${initializerArg.left.value}${initializerArg.operator}${initializerArg.right.value}`,
					});
				}
			}
			if (initializerArg?.type === ArgumentType.IDENTIFIER) {
				const deferred = validateOrDeferUnresolvedIdentifier(initializerArg, line, context);
				if (deferred) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: initializerArg.value });
				}
			}
		}
	}

	return normalized;
}
