import {
	ArgumentType,
	isArrayMemoryDeclarationLine,
	isScalarMemoryDeclarationLine,
	type AST,
	type CompilationContext,
	type MemoryDeclarationLine,
	type ScalarMemoryDeclarationLine,
} from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import {
	validateIntermoduleAddressReference,
	validateOrDeferCompileTimeExpression,
	validateOrDeferUnresolvedIdentifier,
	normalizeArgumentsAtIndexes,
} from './helpers';

import { getError } from '../../compilerError';

function requireResolvedArrayValue(
	argument: AST[number]['arguments'][number] | undefined,
	line: AST[number],
	context: CompilationContext
) {
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const deferred = validateOrDeferCompileTimeExpression(argument, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
				identifier: `${argument.left.value}${argument.operator}${argument.right.value}`,
			});
		}
	}

	if (argument?.type === ArgumentType.IDENTIFIER) {
		const deferred = validateOrDeferUnresolvedIdentifier(argument, line, context);
		if (deferred) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: argument.value });
		}
	}
}

function removeScalarDefault(line: ScalarMemoryDeclarationLine): ScalarMemoryDeclarationLine {
	return { ...line, arguments: [line.arguments[0]] };
}

/**
 * Normalizes compile-time arguments for memory declaration instructions
 * (int, float, float64, array types, pointer types, etc.).
 * Scalar declarations normalize the name/default slots; array declarations normalize
 * the element-count slot and all inline initializer values.
 * Validates intermodule references in default/initializer values if present.
 */
export default function normalizeMemoryDeclaration(
	line: MemoryDeclarationLine,
	context: CompilationContext
): MemoryDeclarationLine {
	const isArrayDeclaration = isArrayMemoryDeclarationLine(line);
	const normalizeIndexes = isArrayDeclaration
		? line.arguments.map((_, index) => index).filter(index => index > 0)
		: [0, 1];
	let { line: normalized } = normalizeArgumentsAtIndexes(line, context, normalizeIndexes);

	const scalarValidationIndexes = isArrayDeclaration ? [0] : [0, 1];
	for (const index of scalarValidationIndexes) {
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
				isScalarMemoryDeclarationLine(normalized) &&
				(argument.referenceKind === 'intermodular-module-reference' ||
					argument.referenceKind === 'intermodular-reference')
			) {
				normalized = removeScalarDefault(normalized);
			}
		}
	}

	if (isArrayMemoryDeclarationLine(normalized)) {
		requireResolvedArrayValue(normalized.arguments[1], line, context);

		for (let index = 2; index < normalized.arguments.length; index++) {
			requireResolvedArrayValue(normalized.arguments[index], line, context);
		}
	}

	return normalized;
}
