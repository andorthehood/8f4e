import type {
	CallLine,
	CodegenPushLine,
	CompilationContext,
	PushArgument,
	PushLine,
	SemanticCallLine,
	SemanticPushLine,
} from '@8f4e/language-spec';
import { ArgumentType, ErrorCode, getError } from '@8f4e/language-spec';
import resolvePushReferences from './push';

function createInlinePushLine(line: CallLine, argument: PushArgument): PushLine {
	return {
		lineNumber: line.lineNumber,
		instruction: 'push',
		arguments: [argument],
	};
}

function isCodegenPushLine(line: SemanticPushLine): line is CodegenPushLine {
	return (
		line.arguments[0].type === ArgumentType.LITERAL ||
		line.arguments[0].type === ArgumentType.STRING_LITERAL ||
		'resolvedTarget' in line
	);
}

/**
 * Semantic reference resolver for the `call` instruction.
 * Validates that the call target function name exists in the function registry
 * and resolves inline argument pushes before stack analysis resolves the
 * concrete overload.
 *
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Call line with resolved inline push references when possible.
 */
export default function resolveCallReferences(
	line: CallLine,
	context: CompilationContext
): CallLine | SemanticCallLine {
	const functionName = line.arguments[0].value;
	const functionRegistry = context.namespace.functions!;
	if (functionRegistry.arityByName[functionName] === undefined) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context);
	}

	const inlineArgumentPushes: SemanticPushLine[] = [];
	const resolvedInlineArguments: PushArgument[] = [];
	let allInlinePushesAreCodegen = true;

	for (const argument of line.arguments.slice(1)) {
		const pushLine = resolvePushReferences(createInlinePushLine(line, argument), context);
		inlineArgumentPushes.push(pushLine);
		resolvedInlineArguments.push(pushLine.arguments[0]);
		allInlinePushesAreCodegen &&= isCodegenPushLine(pushLine);
	}

	const resolvedLine = resolvedInlineArguments.length
		? { ...line, arguments: [line.arguments[0], ...resolvedInlineArguments] as CallLine['arguments'] }
		: line;

	if (!allInlinePushesAreCodegen) {
		return resolvedLine;
	}

	return {
		...resolvedLine,
		...(inlineArgumentPushes.length > 0 ? { inlineArgumentPushes } : {}),
	};
}
