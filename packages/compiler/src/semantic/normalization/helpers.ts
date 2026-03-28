import {
	extractIntermodularElementCountBase,
	extractIntermodularElementMaxBase,
	extractIntermodularElementMinBase,
	extractIntermodularElementWordSizeBase,
	extractIntermodularModuleReferenceBase,
	isIntermodularElementCountReference,
	isIntermodularElementMaxReference,
	isIntermodularElementMinReference,
	isIntermodularElementWordSizeReference,
	isIntermodularReference,
	isIntermodularModuleReference,
} from '@8f4e/tokenizer';

import { tryResolveCompileTimeArgument } from '../resolveCompileTimeArgument';
import { ArgumentType, type AST, type Argument, type CompilationContext } from '../../types';
import { ErrorCode, getError } from '../../compilerError';

export function hasCollectedNamespaces(context: CompilationContext): boolean {
	return Object.keys(context.namespace.namespaces).length > 0;
}

export function isIntermoduleReferenceLike(value: string): boolean {
	return (
		isIntermodularModuleReference(value) ||
		isIntermodularReference(value) ||
		isIntermodularElementCountReference(value) ||
		isIntermodularElementWordSizeReference(value) ||
		isIntermodularElementMaxReference(value) ||
		isIntermodularElementMinReference(value)
	);
}

/**
 * Validates that intermodule address references target existing modules and memory.
 * Called after namespace collection is complete (when namespaces dict is populated).
 * Does NOT validate metadata queries (sizeof, count, etc.) — those are handled by
 * tryResolveCompileTimeArgument returning undefined during prepass.
 */
export function validateIntermoduleAddressReference(
	value: string,
	line: AST[number],
	context: CompilationContext
): void {
	// Only validate if we're post-prepass (namespaces collected)
	if (!hasCollectedNamespaces(context)) {
		return;
	}

	if (isIntermodularModuleReference(value)) {
		const { module: targetModuleId } = extractIntermodularModuleReferenceBase(value);
		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		return;
	}

	if (isIntermodularReference(value)) {
		const cleanRef = value.endsWith('&') ? value.slice(0, -1) : value.substring(1);
		const [targetModuleId, targetMemoryId] = cleanRef.split(':');

		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}

		const targetMemory = context.namespace.namespaces[targetModuleId].memory?.[targetMemoryId];
		if (!targetMemory) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		return;
	}

	// For metadata queries (count, sizeof, max, min), validate module and memory existence
	if (isIntermodularElementCountReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementCountBase(value);
		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!context.namespace.namespaces[targetModuleId].memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		return;
	}

	if (isIntermodularElementWordSizeReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementWordSizeBase(value);
		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!context.namespace.namespaces[targetModuleId].memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		return;
	}

	if (isIntermodularElementMaxReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMaxBase(value);
		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!context.namespace.namespaces[targetModuleId].memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
		return;
	}

	if (isIntermodularElementMinReference(value)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMinBase(value);
		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}
		if (!context.namespace.namespaces[targetModuleId].memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}
	}
}

export function normalizeArgument(argument: Argument, context: CompilationContext): Argument {
	// tryResolveCompileTimeArgument returns undefined for non-IDENTIFIER and non-COMPILE_TIME_EXPRESSION
	// types, so we short-circuit here to avoid unnecessary work.
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	const resolved = tryResolveCompileTimeArgument(context.namespace, argument);

	if (!resolved) {
		return argument;
	}

	return {
		type: ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
	};
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
	if (
		!hasCollectedNamespaces(context) &&
		((typeof argument.lhs === 'string' && isIntermoduleReferenceLike(argument.lhs)) ||
			(typeof argument.rhs === 'string' && isIntermoduleReferenceLike(argument.rhs)))
	) {
		return true;
	}
	if (typeof argument.lhs === 'string') {
		validateIntermoduleAddressReference(argument.lhs, line, context);
	}
	if (typeof argument.rhs === 'string') {
		validateIntermoduleAddressReference(argument.rhs, line, context);
	}
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, {
		identifier: `${argument.lhs}${argument.operator}${argument.rhs}`,
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
	if (!hasCollectedNamespaces(context) && isIntermoduleReferenceLike(argument.value)) {
		return true;
	}
	validateIntermoduleAddressReference(argument.value, line, context);
	throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: argument.value });
}

/**
 * Validates and normalizes arguments at the given indexes for a line.
 * Returns the (possibly updated) line and whether any argument changed.
 * Throws for unresolved compile-time expressions that reference intermodule refs.
 * Does NOT throw for plain unresolved identifiers — callers handle that.
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
