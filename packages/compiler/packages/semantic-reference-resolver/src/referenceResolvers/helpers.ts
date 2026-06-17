import {
	type Argument,
	type ArgumentIdentifier,
	ArgumentType,
	type CompilationContext,
	type CompilerASTLine,
	type Const,
	ErrorCode,
	getError,
	type ResolvedArgumentLiteral,
} from '@8f4e/language-spec';

function getTargetPlannedModule(context: CompilationContext, targetModuleId: string) {
	return context.memoryPlan.modules[targetModuleId];
}

/**
 * Validates that intermodule address references, including metadata-query forms,
 * target existing modules and memory.
 *
 * @param identifier - identifier value to use.
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export function validateIntermoduleAddressReference(
	identifier: ArgumentIdentifier,
	line: CompilerASTLine,
	context: CompilationContext
): void {
	if (identifier.referenceKind === 'intermodular-module-reference') {
		const targetModuleId = identifier.targetModuleId;
		if (!getTargetPlannedModule(context, targetModuleId)) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		return;
	}

	if (identifier.referenceKind === 'intermodular-reference') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;

		const targetModule = getTargetPlannedModule(context, targetModuleId);
		if (!targetModule) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}

		const targetMemory = targetModule?.memory[targetMemoryId];
		if (!targetMemory) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		return;
	}

	// For metadata queries (count, sizeof, max, min), validate module and memory existence
	if (
		identifier.referenceKind === 'intermodular-element-count' ||
		identifier.referenceKind === 'intermodular-element-word-size' ||
		identifier.referenceKind === 'intermodular-element-max' ||
		identifier.referenceKind === 'intermodular-element-min'
	) {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetModule = getTargetPlannedModule(context, targetModuleId);
		if (!targetModule) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!targetModule?.memory[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
	}
}

function literalToConst(argument: Extract<Argument, { type: typeof ArgumentType.LITERAL }>): Const {
	return {
		value: argument.value,
		isInteger: argument.isInteger,
		...(argument.isFloat64 ? { isFloat64: true } : {}),
	};
}

function constToLiteral(resolved: Const): ResolvedArgumentLiteral {
	return {
		type: ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
		...(resolved.address ? { address: resolved.address } : {}),
	};
}

function evaluateLiteralExpression(
	left: Const,
	right: Const,
	operator: Extract<Argument, { type: typeof ArgumentType.COMPILE_TIME_EXPRESSION }>['operator']
): Const | undefined {
	if (operator === '/' && right.value === 0) {
		return undefined;
	}

	const value =
		operator === '+'
			? left.value + right.value
			: operator === '-'
				? left.value - right.value
				: operator === '*'
					? left.value * right.value
					: operator === '/'
						? left.value / right.value
						: left.value ** right.value;
	const isFloat64 = !!left.isFloat64 || !!right.isFloat64;
	const isInteger = !isFloat64 && left.isInteger && right.isInteger && Number.isInteger(value);

	return {
		value,
		isInteger,
		...(isFloat64 ? { isFloat64: true } : {}),
		...(left.address ? { address: left.address } : {}),
	};
}

/**
 * Attempts to fold pure literal arithmetic after constant and memory-reference
 * facts have already been applied by earlier project-level passes.
 *
 * @param argument - Argument whose literal value should be used.
 * @returns The computed result.
 */
export function foldLiteralExpressionArgument(argument: Argument): Argument | ResolvedArgumentLiteral {
	if (argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	if (argument.left.type !== ArgumentType.LITERAL || argument.right.type !== ArgumentType.LITERAL) {
		return argument;
	}

	const resolved = evaluateLiteralExpression(
		literalToConst(argument.left),
		literalToConst(argument.right),
		argument.operator
	);

	return resolved ? constToLiteral(resolved) : argument;
}

/**
 * Validates an unresolved value expression argument and throws UNDECLARED_IDENTIFIER.
 *
 * @param argument - Argument whose resolved value or metadata should be used.
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export function validateUnresolvedValueExpression(
	argument: Extract<Argument, { type: typeof ArgumentType.COMPILE_TIME_EXPRESSION }>,
	line: CompilerASTLine,
	context: CompilationContext
): void {
	if (argument.left.type === ArgumentType.IDENTIFIER) {
		validateIntermoduleAddressReference(argument.left, line, context);
	}
	if (argument.right.type === ArgumentType.IDENTIFIER) {
		validateIntermoduleAddressReference(argument.right, line, context);
	}
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
		identifier: `${argument.left.value}${argument.operator}${argument.right.value}`,
	});
}

/**
 * Validates an unresolved identifier argument for instructions that require full resolution
 * (e.g. map, default) and throws UNDECLARED_IDENTIFIER.
 *
 * @param argument - Argument whose resolved value or metadata should be used.
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export function validateUnresolvedIdentifier(
	argument: Extract<Argument, { type: typeof ArgumentType.IDENTIFIER }>,
	line: CompilerASTLine,
	context: CompilationContext
): void {
	validateIntermoduleAddressReference(argument, line, context);
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: argument.value });
}

/**
 * Folds literal expression arguments at the given indexes for a line.
 * Returns the (possibly updated) line and whether any argument changed.
 * This helper only folds pure literal expressions; it does not itself throw
 * unresolved value expressions or identifiers. Callers are responsible for
 * invoking validation helpers when that behavior is required.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @param indexes - Argument indexes that should be folded.
 * @returns The computed result.
 */
export function resolveArgumentsAtIndexes<TLine extends CompilerASTLine>(
	line: TLine,
	context: CompilationContext,
	indexes: number[]
): { line: TLine; changed: boolean } {
	let changed = false;
	const nextArguments = line.arguments.map((argument, index) => {
		if (!indexes.includes(index)) {
			return argument;
		}

		const resolved = foldLiteralExpressionArgument(argument);
		if (resolved !== argument) {
			changed = true;
		}
		return resolved;
	});

	return { line: changed ? ({ ...line, arguments: nextArguments } as TLine) : line, changed };
}

/**
 * Resolves arguments at the given indexes, then validates any remaining unresolved
 * value expressions or identifiers as errors.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @param indexes - Argument indexes that must be fully resolved.
 * @returns The computed result.
 */
export function resolveAndValidateValueArguments<TLine extends CompilerASTLine>(
	line: TLine,
	context: CompilationContext,
	indexes: number[]
): TLine {
	const { line: resolved } = resolveArgumentsAtIndexes(line, context, indexes);

	for (const index of indexes) {
		const argument = resolved.arguments[index];
		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			validateUnresolvedValueExpression(argument, line, context);
		}
		if (argument?.type === ArgumentType.IDENTIFIER) {
			validateUnresolvedIdentifier(argument, line, context);
		}
	}

	return resolved as TLine;
}
