import type { AsPointerLine, CompilationContext, FunctionValueType, Stack, StackAddress } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import { functionValueTypeToStackItem } from '../../utils/functionValueType';
import { consume, produce } from './stack';

function isPointerFunctionValueType(type: FunctionValueType): boolean {
	return type.endsWith('*');
}

/**
 * Applies a compile-time pointer type assertion to an integer address.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The relevant stack items for the analysis step.
 */
export function analyzeAsPointer(
	line: AsPointerLine,
	context: CompilationContext
): { consumed: Stack; produced: Stack } {
	const pointerType = line.arguments[0].value as FunctionValueType;
	if (!pointerType || !isPointerFunctionValueType(pointerType)) {
		throw getError(ErrorCode.AS_POINTER_REQUIRES_POINTER_TYPE, line, context, {
			identifier: pointerType,
		});
	}

	const consumed = consume(context, 1);
	const [operand] = consumed;
	const typedPointer = functionValueTypeToStackItem(pointerType) as StackAddress;
	const address = operand.kind === 'address' ? operand.address : typedPointer.address;
	const produced: Stack = [
		{
			...typedPointer,
			address,
			...(typedPointer.pointsTo
				? {
						pointsTo: {
							...typedPointer.pointsTo,
							memoryIndex: address.memoryIndex,
							...(address.memoryRegionName ? { memoryRegionName: address.memoryRegionName } : {}),
						},
					}
				: {}),
			...(operand.isNonZero !== undefined ? { isNonZero: operand.isNonZero } : {}),
			...(operand.knownIntegerValue !== undefined ? { knownIntegerValue: operand.knownIntegerValue } : {}),
		},
	];

	produce(context, produced);
	return { consumed, produced };
}
