import { WASM_F64_LE } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';

import lessOrEqual from './lessOrEqual';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('lessOrEqual instruction compiler', () => {
	it('emits I32_LE_S for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		lessOrEqual(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'lessOrEqual',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F32_LE for float operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isNonZero: false });

		lessOrEqual(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'lessOrEqual',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F64_LE for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ isInteger: false, isFloat64: true, isNonZero: false },
			{ isInteger: false, isFloat64: true, isNonZero: false }
		);

		lessOrEqual(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'lessOrEqual',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
		expect(context.byteCode).toEqual([WASM_F64_LE]);
	});
});
