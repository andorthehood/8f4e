import { WASM_F64_SQRT } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';

import sqrt from './sqrt';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

describe('sqrt instruction compiler', () => {
	it('emits F32_SQRT for float operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: true });

		sqrt(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'sqrt',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F64_SQRT for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isFloat64: true, isNonZero: true });

		sqrt(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'sqrt',
				arguments: [],
			} as AST[number],
			context
		);

		expect(context.stack).toEqual([{ isInteger: false, isFloat64: true, isNonZero: false }]);
		expect(context.byteCode).toEqual([WASM_F64_SQRT]);
	});
});
