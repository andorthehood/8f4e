import {
	ArgumentType,
	type CompilationContext,
	type CompilerASTLine,
	isArrayMemoryDeclarationLine,
	type MemoryDeclarationLine,
} from '@8f4e/language-spec';
import {
	resolveArgumentsAtIndexes,
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
 * Resolves value arguments for memory declaration instructions
 * (int, float, float64, array types, pointer types, etc.).
 * Scalar declarations resolve the name/default slots; array declarations resolve
 * the element-count slot and all inline initializer values.
 * Validates intermodule references in default/initializer values if present.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Memory declaration line with resolved value arguments.
 */
export default function resolveMemoryDeclarationReferences(
	line: MemoryDeclarationLine,
	context: CompilationContext
): MemoryDeclarationLine {
	const isArrayDeclaration = isArrayMemoryDeclarationLine(line);
	const resolveIndexes = isArrayDeclaration
		? line.arguments.map((_, index) => index).filter(index => index > 0)
		: [0, 1];
	const { line: resolved } = resolveArgumentsAtIndexes(line, context, resolveIndexes);

	const scalarValidationIndexes = isArrayDeclaration ? [0] : [0, 1];
	for (const index of scalarValidationIndexes) {
		const argument = resolved.arguments[index];
		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			validateUnresolvedValueExpression(argument, line, context);
		}
		if (index === 1 && argument?.type === ArgumentType.IDENTIFIER) {
			validateIntermoduleAddressReference(argument, line, context);
		}
	}

	if (isArrayMemoryDeclarationLine(resolved)) {
		requireResolvedArrayValue(resolved.arguments[1], line, context);

		for (let index = 2; index < resolved.arguments.length; index++) {
			requireResolvedArrayValue(resolved.arguments[index], line, context);
		}
	}

	return resolved;
}
