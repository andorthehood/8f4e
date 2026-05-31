import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import add from './add';

describe('add instruction compiler', () => {
	it('emits I32_ADD for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			add,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'add',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F32_ADD for float32 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'float', isNonZero: false },
			{ kind: 'value', valueType: 'float', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			add,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'add',
				arguments: [],
			} as CompilerASTLine,
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
			{ kind: 'value', valueType: 'float64', isNonZero: false },
			{ kind: 'value', valueType: 'float64', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			add,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'add',
				arguments: [],
			} as CompilerASTLine,
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
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				knownIntegerValue: 0,
				address: {
					safeRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
				},
			},
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 4 }
		);

		analyzeAndCompileInstruction(
			add,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'add',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
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
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				knownIntegerValue: 0,
				address: {
					safeRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
				},
			},
			{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 1024 }
		);

		analyzeAndCompileInstruction(
			add,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'add',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
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
