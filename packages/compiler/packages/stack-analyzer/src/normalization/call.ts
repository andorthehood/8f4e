import type {
	CallLine,
	CodegenPushLine,
	CompilationContext,
	NormalizedCallLine,
	NormalizedPushLine,
	PushArgument,
	PushLine,
} from '@8f4e/compiler-spec';
import { ArgumentType, ErrorCode, getError } from '@8f4e/compiler-spec';
import normalizePush from './push';

function createInlinePushLine(line: CallLine, argument: PushArgument): PushLine {
	return {
		lineNumber: line.lineNumber,
		instruction: 'push',
		arguments: [argument],
	};
}

function isCodegenPushLine(line: NormalizedPushLine): line is CodegenPushLine {
	return (
		line.arguments[0].type === ArgumentType.LITERAL ||
		line.arguments[0].type === ArgumentType.STRING_LITERAL ||
		'resolvedTarget' in line
	);
}

/**
 * Semantic normalizer for the `call` instruction.
 * Validates that the call target function name exists in the function registry
 * and normalizes inline argument pushes before stack analysis resolves the
 * concrete overload.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Normalized call line.
 */
export default function normalizeCall(line: CallLine, context: CompilationContext): CallLine | NormalizedCallLine {
	if (!context.namespace.functions) {
		return line;
	}

	const functionName = line.arguments[0].value;
	if (context.namespace.functions.arityByName[functionName] === undefined) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context);
	}

	const inlineArgumentPushes: NormalizedPushLine[] = [];
	const normalizedInlineArguments: PushArgument[] = [];
	let allInlinePushesAreCodegen = true;

	for (const argument of line.arguments.slice(1)) {
		const pushLine = normalizePush(createInlinePushLine(line, argument), context);
		inlineArgumentPushes.push(pushLine);
		normalizedInlineArguments.push(pushLine.arguments[0]);
		allInlinePushesAreCodegen &&= isCodegenPushLine(pushLine);
	}

	const normalizedLine = normalizedInlineArguments.length
		? { ...line, arguments: [line.arguments[0], ...normalizedInlineArguments] as CallLine['arguments'] }
		: line;

	if (!allInlinePushesAreCodegen) {
		return normalizedLine;
	}

	return {
		...normalizedLine,
		...(inlineArgumentPushes.length > 0 ? { inlineArgumentPushes } : {}),
	};
}
