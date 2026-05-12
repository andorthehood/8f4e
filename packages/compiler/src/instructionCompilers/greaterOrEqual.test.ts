import { WASMInstruction } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';

import greaterOrEqual from './greaterOrEqual';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('greaterOrEqual instruction compiler', () => {
	it('emits I32_GE_S for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		greaterOrEqual(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'greaterOrEqual',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F32_GE for float operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isNonZero: false });

		greaterOrEqual(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'greaterOrEqual',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F64_GE for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ isInteger: false, isFloat64: true, isNonZero: false },
			{ isInteger: false, isFloat64: true, isNonZero: false }
		);

		greaterOrEqual(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'greaterOrEqual',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
		expect(context.byteCode).toEqual([WASMInstruction.F64_GE]);
	});
});
