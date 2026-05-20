import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';

import type { AST, CodegenContext, CompilationContext } from '@8f4e/compiler-spec';

export type MapKind = 'int32' | 'float32' | 'float64';

interface MapValueKind {
	isInteger: boolean;
	isFloat64?: boolean;
}

/**
 * Resolves map value metadata to the internal map kind used for typed WASM emission.
 */
export function resolveMapKind(valueKind: MapValueKind): MapKind {
	if (valueKind.isInteger) {
		return 'int32';
	}

	return valueKind.isFloat64 ? 'float64' : 'float32';
}

/**
 * Validates that a map input, row value, or default value matches the expected map kind.
 */
export function validateMapValueKind(
	valueKind: MapValueKind,
	expectedKind: MapKind,
	line: AST[number],
	context: CodegenContext | CompilationContext
) {
	if (expectedKind === 'float64') {
		if (valueKind.isInteger) {
			throw getError(ErrorCode.ONLY_FLOATS, line, context);
		}
		if (!valueKind.isFloat64) {
			throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
		}
		return;
	}

	if (expectedKind === 'int32') {
		if (!valueKind.isInteger) {
			throw getError(ErrorCode.ONLY_INTEGERS, line, context);
		}
		return;
	}

	if (valueKind.isInteger) {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}
	if (valueKind.isFloat64) {
		throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
	}
}
