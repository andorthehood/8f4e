import {
	type Argument,
	type ArgumentIdentifier,
	ArgumentType,
	type CompilationContext,
	type CompilerASTLine,
	type Const,
	ErrorCode,
	getError,
	type NormalizedArgumentLiteral,
	type ReferenceKind,
} from '@8f4e/language-spec';

/**
 * Returns whether namespace discovery has populated any module or constants namespaces.
 *
 * @param context - Compilation context used by the operation.
 * @returns Whether the check succeeds.
 */
export function hasCollectedNamespaces(context: CompilationContext): boolean {
	return Object.keys(context.namespace.namespaces).length > 0;
}

function getTargetPlannedModule(context: CompilationContext, targetModuleId: string) {
	return context.memoryPlan.modules[targetModuleId];
}

/**
 * Returns whether an identifier reference kind targets another namespace.
 *
 * @param referenceKind - reference kind value to use.
 * @returns Whether the check succeeds.
 */
export function isIntermoduleReferenceKind(referenceKind: ReferenceKind): boolean {
	return (
		referenceKind === 'intermodular-module-reference' ||
		referenceKind === 'intermodular-reference' ||
		referenceKind === 'intermodular-element-count' ||
		referenceKind === 'intermodular-element-word-size' ||
		referenceKind === 'intermodular-element-max' ||
		referenceKind === 'intermodular-element-min'
	);
}

/**
 * Validates that intermodule address references, including metadata-query forms,
 * target existing modules and memory once namespace collection is complete.
 * It does not evaluate the query value itself during namespace discovery; numeric resolution
 * of sizeof/count/max/min forms is handled by the project-level memory reference inliner.
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
	// Only validate once namespace collection has established target modules.
	if (!hasCollectedNamespaces(context)) {
		return;
	}

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

function constToLiteral(resolved: Const): NormalizedArgumentLiteral {
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
 * Attempts to fold pure literal arithmetic after constants and memory references
 * have already been inlined by earlier project-level passes.
 *
 * @param argument - Argument whose literal value should be used.
 * @returns The computed result.
 */
export function normalizeArgument(argument: Argument): Argument | NormalizedArgumentLiteral {
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
 * Validates an unresolved value expression argument, deferring namespace references during discovery.
 * Throws UNDECLARED_IDENTIFIER if the expression cannot be deferred and cannot be resolved.
 * Returns true if the argument was deferred, false if it should continue processing.
 *
 * @param argument - Argument whose resolved value or metadata should be used.
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Whether the check succeeds.
 */
export function validateOrDeferValueExpression(
	argument: Extract<Argument, { type: typeof ArgumentType.COMPILE_TIME_EXPRESSION }>,
	line: CompilerASTLine,
	context: CompilationContext
): boolean {
	if (!hasCollectedNamespaces(context) && argument.intermoduleIds.length > 0) {
		return true;
	}
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
 * (e.g. map, default). Throws UNDECLARED_IDENTIFIER unless the identifier is deferred
 * as a namespace reference during discovery.
 * Returns true if the argument was deferred, false if processing should continue.
 *
 * @param argument - Argument whose resolved value or metadata should be used.
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Whether the check succeeds.
 */
export function validateOrDeferUnresolvedIdentifier(
	argument: Extract<Argument, { type: typeof ArgumentType.IDENTIFIER }>,
	line: CompilerASTLine,
	context: CompilationContext
): boolean {
	if (!hasCollectedNamespaces(context) && isIntermoduleReferenceKind(argument.referenceKind)) {
		return true;
	}
	validateIntermoduleAddressReference(argument, line, context);
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: argument.value });
}

/**
 * Validates and normalizes arguments at the given indexes for a line.
 * Returns the (possibly updated) line and whether any argument changed.
 * This helper only performs folding via normalizeArgument; it does not itself
 * throw or defer unresolved value expressions or identifiers. Callers
 * are responsible for invoking validateOrDefer* helpers when that behavior
 * is required.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @param indexes - Argument indexes that should be normalized.
 * @returns The computed result.
 */
export function normalizeArgumentsAtIndexes<TLine extends CompilerASTLine>(
	line: TLine,
	context: CompilationContext,
	indexes: number[]
): { line: TLine; changed: boolean } {
	let changed = false;
	const nextArguments = line.arguments.map((argument, index) => {
		if (!indexes.includes(index)) {
			return argument;
		}

		const normalized = normalizeArgument(argument);
		if (normalized !== argument) {
			changed = true;
		}
		return normalized;
	});

	return { line: changed ? ({ ...line, arguments: nextArguments } as TLine) : line, changed };
}

/**
 * Normalizes arguments at the given indexes, then validates any remaining unresolved
 * value expressions or identifiers as either deferrable namespace references or errors.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @param indexes - Argument indexes that should be normalized.
 * @returns The computed result.
 */
export function normalizeAndValidateResolvableArgs<TLine extends CompilerASTLine>(
	line: TLine,
	context: CompilationContext,
	indexes: number[]
): TLine {
	const { line: normalized } = normalizeArgumentsAtIndexes(line, context, indexes);

	for (const index of indexes) {
		const argument = normalized.arguments[index];
		if (argument?.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
			const deferred = validateOrDeferValueExpression(argument, line, context);
			if (deferred) {
				continue;
			}
		}
		if (argument?.type === ArgumentType.IDENTIFIER) {
			const deferred = validateOrDeferUnresolvedIdentifier(argument, line, context);
			if (deferred) {
			}
		}
	}

	return normalized as TLine;
}
