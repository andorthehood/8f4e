import type { CodegenContext, CompilerASTLine, StackItem } from '@8f4e/language-spec';
import { ErrorCode } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { resolveMapKind, validateMapValueKind } from './mapValueKind';

describe('map value kind helpers', () => {
	const line = {
		lineNumber: 1,
		instruction: 'map',
		arguments: [],
	} as CompilerASTLine;
	const context = {} as CodegenContext;

	it.each([
		[{ valueType: 'int' }, 'int32'],
		[{ valueType: 'float' }, 'float32'],
		[{ valueType: 'float64' }, 'float64'],
	])('resolves %j to %s', (valueKind, expected) => {
		expect(resolveMapKind(valueKind as StackItem)).toBe(expected);
	});

	it.each([
		[{ valueType: 'int' }, 'int32'],
		[{ valueType: 'float' }, 'float32'],
		[{ valueType: 'float64' }, 'float64'],
	])('accepts %j for %s', (valueKind, expectedKind) => {
		expect(() => validateMapValueKind(valueKind as StackItem, expectedKind, line, context)).not.toThrow();
	});

	it.each([
		[{ valueType: 'float' }, 'int32', ErrorCode.ONLY_INTEGERS],
		[{ valueType: 'int' }, 'float32', ErrorCode.ONLY_FLOATS],
		[{ valueType: 'float64' }, 'float32', ErrorCode.MIXED_FLOAT_WIDTH],
		[{ valueType: 'int' }, 'float64', ErrorCode.ONLY_FLOATS],
		[{ valueType: 'float' }, 'float64', ErrorCode.MIXED_FLOAT_WIDTH],
	])('rejects %j for %s', (valueKind, expectedKind, errorCode) => {
		expect(() => validateMapValueKind(valueKind as StackItem, expectedKind, line, context)).toThrow(
			expect.objectContaining({ code: errorCode })
		);
	});
});
