import { describe, expect, it } from 'vitest';

import risingEdge from './risingEdge';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('risingEdge instruction compiler', () => {
	it('compiles the rising edge segment', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false });

		risingEdge(
			{
				lineNumberBeforeMacroExpansion: 4,
				lineNumberAfterMacroExpansion: 4,
				instruction: 'risingEdge',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			memory: context.namespace.memory,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('compiles the rising edge segment for float operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false });

		risingEdge(
			{
				lineNumberBeforeMacroExpansion: 4,
				lineNumberAfterMacroExpansion: 4,
				instruction: 'risingEdge',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			memory: context.namespace.memory,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
