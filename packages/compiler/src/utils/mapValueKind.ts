import type {
	CodegenContext,
	CompilationContext,
	CompilerASTLine,
	StackItem,
	StackValueType,
} from '@8f4e/compiler-spec';
import { ErrorCode, getError } from '@8f4e/compiler-spec';

/** Internal scalar kind used to choose typed WASM operations for map rows and values. */
export type MapKind = 'int32' | 'float32' | 'float64';

interface MapValueKind {
	valueType: StackValueType;
}

function normalizeMapValueKind(valueKind: MapValueKind | StackItem): MapValueKind {
	return { valueType: valueKind.valueType };
}

/**
 * Resolves map value metadata to the internal map kind used for typed WASM emission.
 *
 * @param valueKind - Map or stack value metadata to resolve.
 * @returns The computed result.
 */
export function resolveMapKind(valueKind: MapValueKind | StackItem): MapKind {
	const normalizedValueKind = normalizeMapValueKind(valueKind);
	if (normalizedValueKind.valueType === 'int') {
		return 'int32';
	}

	return normalizedValueKind.valueType === 'float64' ? 'float64' : 'float32';
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
	valueKind: MapValueKind | StackItem,
	expectedKind: MapKind,
	line: CompilerASTLine,
	context: CodegenContext | CompilationContext
) {
	const normalizedValueKind = normalizeMapValueKind(valueKind);

	if (expectedKind === 'float64') {
		if (normalizedValueKind.valueType === 'int') {
			throw getError(ErrorCode.ONLY_FLOATS, line, context);
		}
		if (normalizedValueKind.valueType !== 'float64') {
			throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
		}
		return;
	}

	if (expectedKind === 'int32') {
		if (normalizedValueKind.valueType !== 'int') {
			throw getError(ErrorCode.ONLY_INTEGERS, line, context);
		}
		return;
	}

	if (normalizedValueKind.valueType === 'int') {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}
	if (normalizedValueKind.valueType === 'float64') {
		throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
	}
}
