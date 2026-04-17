import { describe, expect, it } from 'vitest';

import abs from './abs';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('abs instruction compiler', () => {
	it('emits F32_ABS for float operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: true });

		abs(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'abs',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('compiles int abs via segment instructions', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true });

		abs(
			{
				lineNumberBeforeMacroExpansion: 3,
				lineNumberAfterMacroExpansion: 3,
				instruction: 'abs',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
			locals: context.locals,
		}).toMatchSnapshot();
	});

	it('emits F64_ABS for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isFloat64: true, isNonZero: true });

		abs(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'abs',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
