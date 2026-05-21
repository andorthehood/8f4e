import { describe, expect, it } from 'vitest';

import sub from './sub';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('sub instruction compiler', () => {
	it('emits I32_SUB for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		analyzeAndCompileInstruction(
			sub,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'sub',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F32_SUB for float32 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isNonZero: false });

		analyzeAndCompileInstruction(
			sub,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'sub',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F64_SUB for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ isInteger: false, isFloat64: true, isNonZero: false },
			{ isInteger: false, isFloat64: true, isNonZero: false }
		);

		analyzeAndCompileInstruction(
			sub,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'sub',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('keeps address metadata when subtracting a known negative in-range byte offset', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{
				isInteger: true,
				isNonZero: false,
				knownIntegerValue: 0,
				address: {
					safeRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
				},
			},
			{ isInteger: true, isNonZero: true, knownIntegerValue: -4 }
		);

		analyzeAndCompileInstruction(
			sub,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'sub',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.stack).toEqual([
			{
				isInteger: true,
				isNonZero: true,
				knownIntegerValue: 4,
				address: {
					memoryIndex: 0,
					safeRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 4, safeByteLength: 124, memoryId: 'arr' },
					clampRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
				},
			},
		]);
	});

	it('drops address metadata when subtracting a known positive offset from a start-range address', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{
				isInteger: true,
				isNonZero: false,
				knownIntegerValue: 0,
				address: {
					safeRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
				},
			},
			{ isInteger: true, isNonZero: true, knownIntegerValue: 4 }
		);

		analyzeAndCompileInstruction(
			sub,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'sub',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.stack).toEqual([
			{
				isInteger: true,
				isNonZero: true,
				knownIntegerValue: -4,
				address: {
					memoryIndex: 0,
					clampRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
				},
			},
		]);
	});
});
