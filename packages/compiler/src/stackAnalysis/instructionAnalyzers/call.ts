import type {
	CompilationContext,
	FunctionMetadata,
	FunctionValueType,
	NormalizedCallLine,
	ResolvedCallLine,
	Stack,
	StackItem,
} from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import { functionValueTypeToStackItem, stackItemMatchesFunctionValueType } from '../../utils/functionValueType';
import { analyzePush } from './push';
import { consume, produce } from './stack';

function isPointerFunctionValueType(type: FunctionValueType): boolean {
	return type.endsWith('*');
}

function stackItemExactlyMatchesFunctionValueType(stackItem: StackItem, type: FunctionValueType): boolean {
	if (type === 'float' || type === 'float64') {
		return stackItem.kind === 'value' && stackItem.valueType === type;
	}

	if (type === 'int') {
		return stackItem.valueType === 'int' && (!('pointsTo' in stackItem) || !stackItem.pointsTo);
	}

	if (stackItem.kind !== 'address' || !stackItem.pointsTo) {
		return false;
	}

	const expected = functionValueTypeToStackItem(type);
	if (expected.kind !== 'address' || !expected.pointsTo) {
		return false;
	}

	return (
		stackItem.pointsTo.baseType === expected.pointsTo.baseType &&
		stackItem.pointsTo.pointerDepth === expected.pointsTo.pointerDepth
	);
}

function hasPointerMetadataGap(operands: Stack, overloads: readonly FunctionMetadata[]): boolean {
	return overloads.some(overload =>
		overload.signature.parameters.some((parameter, index) => {
			const operand = operands[index];
			return (
				operand &&
				isPointerFunctionValueType(parameter) &&
				operand.valueType === 'int' &&
				(operand.kind !== 'address' || !operand.pointsTo)
			);
		})
	);
}

type CallResolution = {
	targetFunction: FunctionMetadata;
	exactMatchRequired: boolean;
};

function resolveTargetFunction(line: NormalizedCallLine, context: CompilationContext): CallResolution {
	const functionName = line.arguments[0].value;
	const overloads = context.namespace.functions?.overloadsByName[functionName] ?? [];
	if (overloads.length === 0) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context, { identifier: functionName });
	}

	if (overloads.length === 1) {
		const [targetFunction] = overloads;
		if (context.stack.length < targetFunction.signature.parameters.length) {
			throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
		}
		return { targetFunction, exactMatchRequired: false };
	}

	const minimumParameterCount = Math.min(...overloads.map(overload => overload.signature.parameters.length));
	if (context.stack.length < minimumParameterCount) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	const matchingOverloads = overloads.filter(overload => {
		const { parameters } = overload.signature;
		if (context.stack.length < parameters.length) {
			return false;
		}

		const operands = context.stack.slice(context.stack.length - parameters.length);
		return parameters.every((parameter, index) => stackItemExactlyMatchesFunctionValueType(operands[index], parameter));
	});

	if (matchingOverloads.length === 1) {
		return { targetFunction: matchingOverloads[0], exactMatchRequired: true };
	}

	if (matchingOverloads.length > 1) {
		throw getError(ErrorCode.FUNCTION_OVERLOAD_AMBIGUOUS, line, context, { identifier: functionName });
	}

	const maximumParameterCount = Math.max(...overloads.map(overload => overload.signature.parameters.length));
	const operands = context.stack.slice(Math.max(0, context.stack.length - maximumParameterCount));
	if (hasPointerMetadataGap(operands, overloads)) {
		throw getError(ErrorCode.FUNCTION_OVERLOAD_POINTER_METADATA_REQUIRED, line, context, { identifier: functionName });
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

	const { targetFunction, exactMatchRequired } = resolveTargetFunction(line, context);
	(line as ResolvedCallLine).targetFunction = targetFunction;
	const { parameters, returns } = targetFunction.signature;

	if (context.stack.length < parameters.length) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	for (let i = 0; i < parameters.length; i++) {
		const stackIndex = context.stack.length - parameters.length + i;
		const stackItem = context.stack[stackIndex];
		const matches = exactMatchRequired
			? stackItemExactlyMatchesFunctionValueType(stackItem, parameters[i])
			: stackItemMatchesFunctionValueType(stackItem, parameters[i]);
		if (!matches) {
			throw getError(ErrorCode.FUNCTION_OVERLOAD_NO_MATCH, line, context, { identifier: targetFunction.name });
		}
	}

	const consumed = consume(context, parameters.length);
	const produced = returns.map(returnType => functionValueTypeToStackItem(returnType));
	produce(context, produced);
	return { consumed, produced };
}
