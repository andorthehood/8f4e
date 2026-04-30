import { describe, expect, it } from 'vitest';

import _if from './if';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('if instruction compiler', () => {
	it('emits a void if block when the matching ifEnd declares no result', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false });

		_if(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'if',
				arguments: [],
				ifBlock: { matchingIfEndIndex: 2, resultType: null, hasElse: false },
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits a void if block when given no arguments', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false });

		_if(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'if',
				arguments: [],
				ifBlock: { matchingIfEndIndex: 2, resultType: null, hasElse: false },
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits a float if block', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false });

		_if(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'if',
				arguments: [],
				ifBlock: { matchingIfEndIndex: 2, resultType: 'float', hasElse: false },
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits an int if block', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false });

		_if(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'if',
				arguments: [],
				ifBlock: { matchingIfEndIndex: 2, resultType: 'int', hasElse: false },
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
