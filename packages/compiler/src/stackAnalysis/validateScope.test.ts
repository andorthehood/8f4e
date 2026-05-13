import { describe, expect, it } from 'vitest';
import { BlockType, type BlockStack, type CompilationContext, type InstructionCompiler } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { validateScope } from './validateScope';

const line: Parameters<InstructionCompiler>[0] = {
	lineNumberBeforeMacroExpansion: 1,
	lineNumberAfterMacroExpansion: 1,
	instruction: 'test' as never,
	arguments: [],
};
const context = { stack: [] } as unknown as CompilationContext;

const moduleStack: BlockStack = [
	{
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BlockType.MODULE,
	},
];
const functionStack: BlockStack = [
	{
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BlockType.FUNCTION,
	},
];

describe('validateScope', () => {
	it('accepts valid scopes', () => {
		expect(() => validateScope(moduleStack, 'module', line, context, ErrorCode.UNKNOWN_ERROR)).not.toThrow();
		expect(() => validateScope(functionStack, 'function', line, context, ErrorCode.UNKNOWN_ERROR)).not.toThrow();
	});

	it('rejects invalid scopes', () => {
		expect(() => validateScope([], 'module', line, context, ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK)).toThrow(
			`${ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK}`
		);
	});
});
