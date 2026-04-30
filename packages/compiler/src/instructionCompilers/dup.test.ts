import { describe, expect, it } from 'vitest';

import dup from './dup';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('dup instruction compiler', () => {
	it('duplicates the top stack value', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false });

		dup(
			{
				lineNumberBeforeMacroExpansion: 3,
				lineNumberAfterMacroExpansion: 3,
				instruction: 'dup',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('duplicates float64 while preserving float64 type', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isFloat64: true, isNonZero: false });

		dup(
			{
				lineNumberBeforeMacroExpansion: 4,
				lineNumberAfterMacroExpansion: 4,
				instruction: 'dup',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
