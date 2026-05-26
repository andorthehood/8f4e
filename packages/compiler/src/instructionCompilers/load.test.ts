import { describe, expect, it } from 'vitest';
import { WASM_MEMORY_SIZE } from '@8f4e/compiler-wasm-utils';

import load from './load';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { CompilerASTLine } from '@8f4e/compiler-spec';

describe('load instruction compiler', () => {
	it('loads from a safe memory address', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: false,
			address: {
				safeRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 4, memoryId: 'test' },
			},
		});

		analyzeAndCompileInstruction(
			load,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'load',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('loads from an unsafe memory address with a bounds guard', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: false,
		});

		analyzeAndCompileInstruction(
			load,
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'load8u',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('guards when address metadata is shorter than the access width', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: false,
			address: {
				safeRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 2, memoryId: 'test' },
			},
		});

		analyzeAndCompileInstruction(
			load,
			{
				lineNumberBeforeMacroExpansion: 3,
				lineNumberAfterMacroExpansion: 3,
				instruction: 'load',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).toContain(WASM_MEMORY_SIZE);
	});

	it('does not guard when an explicit clamp proves the access width is safe', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: false,
			address: {
				safeAccessByteWidth: 4,
			},
		});

		analyzeAndCompileInstruction(
			load,
			{
				lineNumberBeforeMacroExpansion: 4,
				lineNumberAfterMacroExpansion: 4,
				instruction: 'load',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).not.toContain(WASM_MEMORY_SIZE);
	});
});
