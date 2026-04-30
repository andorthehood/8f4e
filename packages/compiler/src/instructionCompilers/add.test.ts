import { describe, expect, it } from 'vitest';

import add from './add';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('add instruction compiler', () => {
	it('emits I32_ADD for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		add(
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

		add(
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

		add(
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

	it('throws on mixed float32/float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isFloat64: true, isNonZero: false });

		expect(() => {
			add(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'add',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrowError();
	});

	it('keeps address metadata when adding a known in-range byte offset', () => {
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

		add(
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
				memoryAddress: { source: 'memory-start', byteAddress: 4, safeByteLength: 124, memoryId: 'arr' },
				memoryAddressRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
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
				memoryAddress: { source: 'memory-start', byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
			},
			{ isInteger: true, isNonZero: true, knownIntegerValue: 1024 }
		);

		add(
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
				memoryAddressRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
			},
		]);
	});
});
