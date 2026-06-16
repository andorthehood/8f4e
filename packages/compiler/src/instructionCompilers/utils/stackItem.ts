import type { CodegenContext, CompilationContext, CompilerASTLine, StackAddress, StackItem } from '@8f4e/compiler-spec';
import { ErrorCode, getError } from '@8f4e/compiler-spec';

/**
 * Converts an integer-compatible stack item into an address or throws on non-addressable values.
 *
 * @param item - Stack item to inspect.
 * @param line - Source AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export function requireStackAddress(
	item: StackItem,
	line: CompilerASTLine,
	context: CodegenContext | CompilationContext
): StackAddress {
	if (item.kind !== 'address') {
		if (item.valueType === 'int') {
			return {
				kind: 'address',
				valueType: 'int',
				address: { memoryIndex: 0 },
				...(item.isNonZero !== undefined ? { isNonZero: item.isNonZero } : {}),
				...(item.knownIntegerValue !== undefined ? { knownIntegerValue: item.knownIntegerValue } : {}),
			};
		}
		throw getError(ErrorCode.TYPE_MISMATCH, line, context);
	}

	return {
		kind: 'address',
		valueType: 'int',
		address: item.address,
		...(item.pointsTo ? { pointsTo: item.pointsTo } : {}),
		...(item.isNonZero !== undefined ? { isNonZero: item.isNonZero } : {}),
		...(item.knownIntegerValue !== undefined ? { knownIntegerValue: item.knownIntegerValue } : {}),
	};
}
