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
 * Both the name argument (index 0) and the default value argument (index 1) are normalized.
 * Validates intermodule references in the default value if present.
 */
export default function normalizeMemoryDeclaration(line: AST[number], context: CompilationContext): AST[number] {
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

			// If the argument could not be folded to a literal (referenceKind is an address-style
			// intermodule ref whose target module has not yet been laid out), strip the default
			// from the line. The deferred state is owned here rather than relying on
			// parseMemoryInstructionArguments to fabricate a placeholder 0.
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
