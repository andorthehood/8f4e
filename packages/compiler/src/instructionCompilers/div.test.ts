import { describe, expect, it } from 'vitest';

import div from './div';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('div instruction compiler', () => {
	it('emits I32_DIV_S for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true }, { isInteger: true, isNonZero: true });

		div(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'div',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F32_DIV for float32 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: true }, { isInteger: false, isNonZero: true });

		div(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'div',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F64_DIV for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ isInteger: false, isFloat64: true, isNonZero: true },
			{ isInteger: false, isFloat64: true, isNonZero: true }
		);

		div(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'div',
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
		context.stack.push({ isInteger: false, isNonZero: true }, { isInteger: false, isFloat64: true, isNonZero: true });

		expect(() => {
			div(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'div',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrowError();
	});

	it('throws on division by zero', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true }, { isInteger: true, isNonZero: false });

		expect(() => {
			div(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'div',
					arguments: [],
				} as AST[number],
				context
			);
		}).toThrowError();
	});
});
