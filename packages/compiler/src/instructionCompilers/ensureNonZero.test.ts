import { describe, expect, it } from 'vitest';
import { ArgumentType } from '@8f4e/compiler-types';

import ensureNonZero from './ensureNonZero';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('ensureNonZero instruction compiler', () => {
	it('ensures integer operand is non-zero', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false });

		ensureNonZero(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'ensureNonZero',
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

	it('ensures float operand is non-zero with literal default', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: false });

		ensureNonZero(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'ensureNonZero',
				arguments: [{ type: ArgumentType.LITERAL, value: 2.5, isInteger: false }],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('ensures float64 operand is non-zero with float64 default', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isFloat64: true, isNonZero: false });

		ensureNonZero(
			{
				lineNumberBeforeMacroExpansion: 3,
				lineNumberAfterMacroExpansion: 3,
				instruction: 'ensureNonZero',
				arguments: [
					{
						type: ArgumentType.LITERAL,
						value: 2.5,
						isInteger: false,
						isFloat64: true,
					},
				],
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
