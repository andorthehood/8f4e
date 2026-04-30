import {
	ArgumentType,
	type ReferenceKind,
	type AST,
	type Argument,
	type ArgumentIdentifier,
	type CompilationContext,
	type NormalizedArgumentLiteral,
} from '@8f4e/compiler-types';

import { tryResolveCompileTimeArgument } from '../resolveCompileTimeArgument';
import { ErrorCode, getError } from '../../compilerError';

export function hasCollectedNamespaces(context: CompilationContext): boolean {
	return Object.keys(context.namespace.namespaces).length > 0;
}

function getTargetModuleNamespace(context: CompilationContext, targetModuleId: string) {
	const targetNamespace = context.namespace.namespaces[targetModuleId];
	return targetNamespace?.kind === 'module' ? targetNamespace : undefined;
}

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
 * It does not evaluate the query value itself during prepass; numeric resolution
 * of sizeof/count/max/min forms is handled by tryResolveCompileTimeArgument.
 */
export function validateIntermoduleAddressReference(
	identifier: ArgumentIdentifier,
	line: AST[number],
	context: CompilationContext
): void {
	// Only validate if we're post-prepass (namespaces collected)
	if (!hasCollectedNamespaces(context)) {
		return;
	}

	if (identifier.referenceKind === 'intermodular-module-reference') {
		const targetModuleId = identifier.targetModuleId;
		if (!getTargetModuleNamespace(context, targetModuleId)) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		return;
	}

	if (identifier.referenceKind === 'intermodular-reference') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;

		const targetNamespace = getTargetModuleNamespace(context, targetModuleId);
		if (!targetNamespace) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}

		const targetMemory = targetNamespace.memory?.[targetMemoryId];
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
		const targetNamespace = getTargetModuleNamespace(context, targetModuleId);
		if (!targetNamespace) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!targetNamespace.memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
	}
}

export function normalizeArgument(
	argument: Argument,
	context: CompilationContext
): Argument | NormalizedArgumentLiteral {
	// tryResolveCompileTimeArgument returns undefined for non-IDENTIFIER and non-COMPILE_TIME_EXPRESSION
	// types, so we short-circuit here to avoid unnecessary work.
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	const resolved = tryResolveCompileTimeArgument(context, argument);

	if (!resolved) {
		return argument;
	}

	const literal: NormalizedArgumentLiteral = {
		type: ArgumentType.LITERAL as ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
		...(resolved.safeAddressRange ? { safeAddressRange: resolved.safeAddressRange } : {}),
	};

	return literal;
}

/**
 * Validates an unresolved compile-time expression argument, deferring for prepass intermodule refs.
 * Throws UNDECLARED_IDENTIFIER if the expression cannot be deferred and cannot be resolved.
 * Returns true if the argument was deferred (prepass intermodule), false if it should continue processing.
 */
export function validateOrDeferCompileTimeExpression(
	argument: Extract<Argument, { type: ArgumentType.COMPILE_TIME_EXPRESSION }>,
	line: AST[number],
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
 * as a prepass intermodule reference.
 * Returns true if the argument was deferred (prepass intermodule), false if processing should continue.
 */
export function validateOrDeferUnresolvedIdentifier(
	argument: Extract<Argument, { type: ArgumentType.IDENTIFIER }>,
	line: AST[number],
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
 * throw or defer unresolved compile-time expressions or identifiers. Callers
 * are responsible for invoking validateOrDefer* helpers when that behavior
 * is required.
 */
export function normalizeArgumentsAtIndexes(
	line: AST[number],
	context: CompilationContext,
	indexes: number[]
): { line: AST[number]; changed: boolean } {
	let changed = false;
	const nextArguments = line.arguments.map((argument, index) => {
		if (!indexes.includes(index)) {
			return argument;
		}

		const normalized = normalizeArgument(argument, context);
		if (normalized !== argument) {
			changed = true;
		}
		return normalized;
	});

	return { line: changed ? { ...line, arguments: nextArguments } : line, changed };
}
