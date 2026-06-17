import type { CodegenContext, CompilationContext, CompilerASTLine, StackValueType } from '@8f4e/language-spec';
import { ErrorCode, getError } from '@8f4e/language-spec';

/** Internal scalar kind used to choose typed WASM operations for map rows and values. */
export type MapKind = 'int32' | 'float32' | 'float64';

/**
 * Resolves map value metadata to the internal map kind used for typed WASM emission.
 *
 * @param valueKind - Map or stack value metadata to resolve.
 * @returns The computed result.
 */
export function resolveMapKind(valueKind: { valueType: StackValueType }): MapKind {
	if (valueKind.valueType === 'int') {
		return 'int32';
	}

	return valueKind.valueType === 'float64' ? 'float64' : 'float32';
}

/**
 * Validates that a map input, row value, or default value matches the expected map kind.
 *
 * @param valueKind - Map or stack value metadata to resolve.
 * @param expectedKind - Map kind that the value must match.
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export function validateMapValueKind(
	valueKind: { valueType: StackValueType },
	expectedKind: MapKind,
	line: CompilerASTLine,
	context: CodegenContext | CompilationContext
) {
	if (expectedKind === 'float64') {
		if (valueKind.valueType === 'int') {
			throw getError(ErrorCode.ONLY_FLOATS, line, context);
		}
		if (valueKind.valueType !== 'float64') {
			throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
		}
		return;
	}

	if (expectedKind === 'int32') {
		if (valueKind.valueType !== 'int') {
			throw getError(ErrorCode.ONLY_INTEGERS, line, context);
		}
		return;
	}

	if (valueKind.valueType === 'int') {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}
	if (valueKind.valueType === 'float64') {
		throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
	}
}
