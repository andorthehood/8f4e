import { describe, expect, it } from 'vitest';

import add from './add';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('add instruction compiler', () => {
	it('emits I32_ADD for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		analyzeAndCompileInstruction(
			add,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'add',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F32_ADD for float32 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isNonZero: false });

		analyzeAndCompileInstruction(
			add,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'add',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F64_ADD for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ isInteger: false, isFloat64: true, isNonZero: false },
			{ isInteger: false, isFloat64: true, isNonZero: false }
		);

		analyzeAndCompileInstruction(
			add,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'add',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('keeps address metadata when adding a known in-range byte offset', () => {
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
			add,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'add',
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

	it('drops address metadata when adding a known out-of-range byte offset', () => {
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
			{ isInteger: true, isNonZero: true, knownIntegerValue: 1024 }
		);

		analyzeAndCompileInstruction(
			add,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'add',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.stack).toEqual([
			{
				isInteger: true,
				isNonZero: true,
				knownIntegerValue: 1024,
				address: {
					memoryIndex: 0,
					clampRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
				},
			},
		]);
	});
});
