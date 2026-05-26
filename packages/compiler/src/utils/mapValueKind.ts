import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

import type {
	CompilerASTLine,
	CodegenContext,
	CompilationContext,
	StackItem,
	StackValueType,
} from '@8f4e/compiler-spec';

export type MapKind = 'int32' | 'float32' | 'float64';

interface MapValueKind {
	valueType: StackValueType;
}

function normalizeMapValueKind(valueKind: MapValueKind | StackItem): MapValueKind {
	return { valueType: valueKind.valueType };
}

/**
 * Resolves map value metadata to the internal map kind used for typed WASM emission.
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
