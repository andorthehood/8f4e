import type {
	CallLine,
	CodegenPushLine,
	CompilationContext,
	NormalizedPushLine,
	PushArgument,
	PushLine,
	ResolvedCallLine,
} from '@8f4e/compiler-spec';
import { ArgumentType, ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
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
 * before codegen runs. This is the semantic ownership boundary for function
 * existence validation; codegen only handles stack shape, parameter/return
 * type compatibility, and lowering.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Normalized call line.
 */
export default function normalizeCall(line: CallLine, context: CompilationContext): CallLine | ResolvedCallLine {
	if (!context.namespace.functions) {
		return line;
	}

	const functionName = line.arguments[0].value;
	const overloads = context.namespace.functions.overloadsByName[functionName];
	if (!overloads || overloads.length !== 1) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context);
	}
	const [targetFunction] = overloads;

	const inlineArgumentPushes = line.arguments
		.slice(1)
		.map(argument => normalizePush(createInlinePushLine(line, argument), context));
	const normalizedInlineArguments = inlineArgumentPushes.map(pushLine => pushLine.arguments[0]);
	const normalizedLine = normalizedInlineArguments.length
		? { ...line, arguments: [line.arguments[0], ...normalizedInlineArguments] as CallLine['arguments'] }
		: line;

	if (!inlineArgumentPushes.every(isCodegenPushLine)) {
		return { ...normalizedLine, targetFunction };
	}

	return {
		...normalizedLine,
		targetFunction,
		...(inlineArgumentPushes.length > 0 ? { inlineArgumentPushes } : {}),
	};
}
