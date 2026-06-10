import type {
	CompilationContext,
	FunctionMetadata,
	FunctionValueType,
	NormalizedCallLine,
	ResolvedCallLine,
	Stack,
	StackItem,
} from '@8f4e/compiler-spec';
import { createFunctionId, ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import { functionValueTypeToStackItem } from '../../utils/functionValueType';
import { analyzePush } from './push';
import { consume, produce } from './stack';

function stackItemToExactFunctionValueType(stackItem: StackItem): FunctionValueType {
	if (stackItem.kind === 'address' && stackItem.pointsTo) {
		return `${stackItem.pointsTo.baseType}${'*'.repeat(stackItem.pointsTo.pointerDepth)}` as FunctionValueType;
	}

	return stackItem.valueType as FunctionValueType;
}

function stackItemsToFunctionId(functionName: string, stackItems: readonly StackItem[]): string {
	return createFunctionId(functionName, stackItems.map(stackItemToExactFunctionValueType));
}

function resolveTargetFunction(line: NormalizedCallLine, context: CompilationContext): FunctionMetadata {
	const functionName = line.arguments[0].value;
	const functionRegistry = context.namespace.functions;
	if (!functionRegistry) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context, { identifier: functionName });
	}

	const arity = functionRegistry.arityByName[functionName];
	if (arity === undefined) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context, { identifier: functionName });
	}

	if (context.stack.length < arity) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	const operands = context.stack.slice(context.stack.length - arity);
	const exactMatch = functionRegistry.byId[stackItemsToFunctionId(functionName, operands)];
	if (exactMatch) {
		return exactMatch;
	}

	throw getError(ErrorCode.FUNCTION_OVERLOAD_NO_MATCH, line, context, { identifier: functionName });
}

/**
 * Applies function-call stack effects after validating arguments against the resolved target signature.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The relevant stack items for the analysis step.
 */
export function analyzeCall(
	line: NormalizedCallLine | ResolvedCallLine,
	context: CompilationContext
): { consumed: Stack; produced: Stack } {
	for (const inlinePushLine of line.inlineArgumentPushes ?? []) {
		analyzePush(inlinePushLine, context);
	}

	const targetFunction = resolveTargetFunction(line, context);
	(line as ResolvedCallLine).targetFunction = targetFunction;
	targetFunction.used = true;
	const { parameters, returns } = targetFunction.signature;

	const consumed = consume(context, parameters.length);
	const produced = returns.map(returnType => functionValueTypeToStackItem(returnType));
	produce(context, produced);
	return { consumed, produced };
}
