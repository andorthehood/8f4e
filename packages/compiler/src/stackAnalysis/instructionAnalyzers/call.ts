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
	let exactMatch: FunctionMetadata | undefined;
	let exactMatchCount = 0;
	let intCompatibleMatch: FunctionMetadata | undefined;
	let intCompatibleMatchCount = 0;
	let hasPointerMetadataGap = false;

	for (const overload of overloads) {
		let exactMatches = true;
		let intCompatibleMatches = true;

		for (let index = 0; index < arity; index++) {
			const parameter = overload.signature.parameters[index];
			const operand = operands[index];
			const exactParameterMatch = stackItemExactlyMatchesFunctionValueType(operand, parameter);
			const intCompatibleParameterMatch = parameter === 'int' ? operand.valueType === 'int' : exactParameterMatch;

			exactMatches &&= exactParameterMatch;
			intCompatibleMatches &&= intCompatibleParameterMatch;
			hasPointerMetadataGap ||=
				isPointerFunctionValueType(parameter) &&
				operand.valueType === 'int' &&
				(operand.kind !== 'address' || !operand.pointsTo);
		}

		if (exactMatches) {
			exactMatch = overload;
			exactMatchCount++;
		}

		if (intCompatibleMatches) {
			intCompatibleMatch = overload;
			intCompatibleMatchCount++;
		}
	}

	if (exactMatchCount === 1) {
		return exactMatch!;
	}

	if (hasPointerMetadataGap) {
		throw getError(ErrorCode.FUNCTION_OVERLOAD_POINTER_METADATA_REQUIRED, line, context, { identifier: functionName });
	}

	if (intCompatibleMatchCount === 1) {
		return intCompatibleMatch!;
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
