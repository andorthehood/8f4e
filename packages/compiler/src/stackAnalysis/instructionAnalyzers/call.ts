import type {
	CompilationContext,
	FunctionMetadata,
	FunctionValueType,
	NormalizedCallLine,
	ResolvedCallLine,
	Stack,
	StackAddress,
	StackItem,
} from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import { functionValueTypeToStackItem } from '../../utils/functionValueType';
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

	const expected = functionValueTypeToStackItem(type) as StackAddress;
	const expectedPointsTo = expected.pointsTo!;

	return (
		stackItem.pointsTo.baseType === expectedPointsTo.baseType &&
		stackItem.pointsTo.pointerDepth === expectedPointsTo.pointerDepth
	);
}

function stackItemIntCompatibleWithFunctionValueType(stackItem: StackItem, type: FunctionValueType): boolean {
	if (type !== 'int') {
		return stackItemExactlyMatchesFunctionValueType(stackItem, type);
	}

	return stackItem.valueType === 'int';
}

function hasPointerMetadataGap(operands: Stack, overloads: readonly FunctionMetadata[]): boolean {
	return overloads.some(overload =>
		overload.signature.parameters.some((parameter, index) => {
			const operand = operands[index];
			return (
				isPointerFunctionValueType(parameter) &&
				operand.valueType === 'int' &&
				(operand.kind !== 'address' || !operand.pointsTo)
			);
		})
	);
}

function resolveTargetFunction(line: NormalizedCallLine, context: CompilationContext): FunctionMetadata {
	const functionName = line.arguments[0].value;
	const overloads = context.namespace.functions?.overloadsByName[functionName] ?? [];
	if (overloads.length === 0) {
		throw getError(ErrorCode.UNDEFINED_FUNCTION, line, context, { identifier: functionName });
	}

	const arity = overloads[0].signature.parameters.length;
	if (context.stack.length < arity) {
		throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
	}

	const operands = context.stack.slice(context.stack.length - arity);
	const matchingOverloads = overloads.filter(overload => {
		return overload.signature.parameters.every((parameter, index) =>
			stackItemExactlyMatchesFunctionValueType(operands[index], parameter)
		);
	});

	if (matchingOverloads.length === 1) {
		return matchingOverloads[0];
	}

	if (hasPointerMetadataGap(operands, overloads)) {
		throw getError(ErrorCode.FUNCTION_OVERLOAD_POINTER_METADATA_REQUIRED, line, context, { identifier: functionName });
	}

	const intCompatibleOverloads = overloads.filter(overload => {
		return overload.signature.parameters.every((parameter, index) =>
			stackItemIntCompatibleWithFunctionValueType(operands[index], parameter)
		);
	});

	if (intCompatibleOverloads.length === 1) {
		return intCompatibleOverloads[0];
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
	const { parameters, returns } = targetFunction.signature;

	const consumed = consume(context, parameters.length);
	const produced = returns.map(returnType => functionValueTypeToStackItem(returnType));
	produce(context, produced);
	return { consumed, produced };
}
