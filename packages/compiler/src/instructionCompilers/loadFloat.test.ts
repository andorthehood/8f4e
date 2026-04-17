import { describe, expect, it } from 'vitest';

import loadFloat from './loadFloat';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('loadFloat instruction compiler', () => {
	it('loads from a safe memory address', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: false,
			isSafeMemoryAddress: true,
		});

		loadFloat(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'loadFloat',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('loads from an unsafe memory address without extra bounds checks', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: false,
			isSafeMemoryAddress: false,
		});

		loadFloat(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'loadFloat',
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
