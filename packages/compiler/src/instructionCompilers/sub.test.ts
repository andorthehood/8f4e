import { describe, expect, it } from 'vitest';

import sub from './sub';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('sub instruction compiler', () => {
	it('emits I32_SUB for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		sub(
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

		sub(
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

		sub(
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

	it('throws on mixed float32/float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isFloat64: true, isNonZero: false });

		expect(() => {
			sub(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'sub',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrowError();
	});

	it('keeps address metadata when subtracting a known negative in-range byte offset', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{
				isInteger: true,
				isNonZero: false,
				knownIntegerValue: 0,
				memoryAddress: { source: 'memory-start', byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
			},
			{ isInteger: true, isNonZero: true, knownIntegerValue: -4 }
		);

		sub(
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
				memoryAddress: { source: 'memory-start', byteAddress: 4, safeByteLength: 124, memoryId: 'arr' },
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
				memoryAddress: { source: 'memory-start', byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
			},
			{ isInteger: true, isNonZero: true, knownIntegerValue: 4 }
		);

		sub(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'sub',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.stack).toEqual([{ isInteger: true, isNonZero: true, knownIntegerValue: -4 }]);
	});
});
