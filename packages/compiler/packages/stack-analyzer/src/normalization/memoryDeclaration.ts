import {
	ArgumentType,
	type CompilationContext,
	type CompilerASTLine,
	isArrayMemoryDeclarationLine,
	type MemoryDeclarationLine,
} from '@8f4e/language-spec';
import {
	normalizeArgumentsAtIndexes,
	validateIntermoduleAddressReference,
	validateUnresolvedIdentifier,
	validateUnresolvedValueExpression,
} from './helpers';

function requireResolvedArrayValue(
	argument: CompilerASTLine['arguments'][number] | undefined,
	line: CompilerASTLine,
	context: CompilationContext
) {
	if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		validateUnresolvedValueExpression(argument, line, context);
	}

	if (argument?.type === ArgumentType.IDENTIFIER) {
		validateUnresolvedIdentifier(argument, line, context);
	}
}

/**
 * Normalizes value arguments for memory declaration instructions
 * (int, float, float64, array types, pointer types, etc.).
 * Scalar declarations normalize the name/default slots; array declarations normalize
 * the element-count slot and all inline initializer values.
 * Validates intermodule references in default/initializer values if present.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Normalized memory declaration line.
 */
export default function normalizeMemoryDeclaration(
	line: MemoryDeclarationLine,
	context: CompilationContext
): MemoryDeclarationLine {
	const isArrayDeclaration = isArrayMemoryDeclarationLine(line);
	const normalizeIndexes = isArrayDeclaration
		? line.arguments.map((_, index) => index).filter(index => index > 0)
		: [0, 1];
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, normalizeIndexes);

	const scalarValidationIndexes = isArrayDeclaration ? [0] : [0, 1];
	for (const index of scalarValidationIndexes) {
		const argument = normalized.arguments[index];
		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			validateUnresolvedValueExpression(argument, line, context);
		}
		if (index === 1 && argument?.type === ArgumentType.IDENTIFIER) {
			validateIntermoduleAddressReference(argument, line, context);
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
