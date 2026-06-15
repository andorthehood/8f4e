import type {
	Argument,
	CompilationContext,
	CompilerASTLine,
	CompileTimeOperand,
	Const,
	NormalizedArgumentLiteral,
} from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import { evaluateResolvedValueExpression } from './evaluateResolvedValueExpression';
import { resolveMemoryExpressionOperand } from './resolveMemoryExpressionOperand';

export { memoryEndAddressValue, memoryStartAddressValue, moduleAddressValue } from './addressValues';
export { resolveMemoryExpressionOperand } from './resolveMemoryExpressionOperand';

export interface InlineMemoryReferencesInput<TLine extends CompilerASTLine = CompilerASTLine> {
	lines: readonly TLine[];
	context: CompilationContext;
}

export interface InlineMemoryReferencesResult<TLine extends CompilerASTLine = CompilerASTLine> {
	lines: TLine[];
}

function resolveValueOperand(operand: CompileTimeOperand, context: CompilationContext): Const | undefined {
	if (operand.type === ArgumentType.LITERAL) {
		return {
			value: operand.value,
			isInteger: operand.isInteger,
			...(operand.isFloat64 ? { isFloat64: true } : {}),
		};
	}

	return resolveMemoryExpressionOperand(operand, context);
}

function resolvedValueToLiteral(resolved: Const): NormalizedArgumentLiteral {
	return {
		type: ArgumentType.LITERAL,
		value: resolved.value,
		isInteger: resolved.isInteger,
		...(resolved.isFloat64 ? { isFloat64: true } : {}),
		...(resolved.address ? { address: resolved.address } : {}),
	};
}

/**
 * Attempts to fold an argument into a semantic value using the current memory layout context.
 * Constant identifiers are expected to have been inlined before this pass runs.
 *
 * @param context - Compilation context used by the operation.
 * @param argument - Argument whose resolved value or metadata should be used.
 * @returns Resolved value, or `undefined` when the argument cannot be folded.
 */
export function tryResolveValueArgument(context: CompilationContext, argument: Argument): Const | undefined {
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return undefined;
	}

	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		const leftConst = resolveValueOperand(argument.left, context);
		const rightConst = resolveValueOperand(argument.right, context);

		if (leftConst === undefined || rightConst === undefined) {
			return undefined;
		}

		if (argument.operator === '/' && rightConst.value === 0) {
			return undefined;
		}

		return evaluateResolvedValueExpression(leftConst, rightConst, argument.operator);
	}

	return resolveValueOperand(argument, context);
}

/**
 * Inlines one memory-layout value argument when the provided layout context can resolve it.
 *
 * @param argument - Argument to inline.
 * @param context - Compilation context used by the operation.
 * @returns The original argument or a literal carrying resolved value/address metadata.
 */
export function inlineMemoryReferenceArgument(
	argument: Argument,
	context: CompilationContext
): Argument | NormalizedArgumentLiteral {
	if (argument.type !== ArgumentType.IDENTIFIER && argument.type !== ArgumentType.COMPILE_TIME_EXPRESSION) {
		return argument;
	}

	const resolved = tryResolveValueArgument(context, argument);
	if (!resolved) {
		return argument;
	}

	return resolvedValueToLiteral(resolved);
}

/**
 * Returns a copied line with all resolvable memory-layout value references inlined.
 *
 * @param line - AST line to transform.
 * @param context - Compilation context used by the operation.
 * @returns Original line when unchanged, otherwise a copied line with inlined arguments.
 */
export function inlineMemoryReferencesInLine<TLine extends CompilerASTLine>(
	line: TLine,
	context: CompilationContext
): TLine {
	let changed = false;
	const nextArguments = line.arguments.map(argument => {
		const inlined = inlineMemoryReferenceArgument(argument, context);
		if (inlined !== argument) {
			changed = true;
		}
		return inlined;
	});

	return changed ? ({ ...line, arguments: nextArguments } as TLine) : line;
}

/**
 * Returns copied AST lines with resolvable memory-layout value references inlined.
 *
 * @param input - Lines and layout context to transform.
 * @returns Inlined line collection.
 */
export function inlineMemoryReferences<TLine extends CompilerASTLine>(
	input: InlineMemoryReferencesInput<TLine>
): InlineMemoryReferencesResult<TLine> {
	return {
		lines: input.lines.map(line => inlineMemoryReferencesInLine(line, input.context)),
	};
}
