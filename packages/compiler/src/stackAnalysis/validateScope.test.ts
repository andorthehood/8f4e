import { describe, expect, it } from 'vitest';
import { type CompilationContext, type InstructionCompiler } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { validateScope } from './validateScope';

const line: Parameters<InstructionCompiler>[0] = {
	lineNumberBeforeMacroExpansion: 1,
	lineNumberAfterMacroExpansion: 1,
	instruction: 'test' as never,
	arguments: [],
};
describe('validateScope', () => {
	it('accepts valid scopes', () => {
		expect(() =>
			validateScope('module', line, { insideModuleBlock: true } as CompilationContext, ErrorCode.UNKNOWN_ERROR)
		).not.toThrow();
		expect(() =>
			validateScope('function', line, { insideFunctionBlock: true } as CompilationContext, ErrorCode.UNKNOWN_ERROR)
		).not.toThrow();
	});

	it('rejects invalid scopes', () => {
		expect(() =>
			validateScope('module', line, {} as CompilationContext, ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK)
		).toThrow(`${ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK}`);
	});
});
