import { describe, expect, it } from 'vitest';
import { ArgumentType } from '@8f4e/compiler-types';

import loop from './loop';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('loop instruction compiler', () => {
	it('compiles the loop segment with default cap', () => {
		const context = createInstructionCompilerTestContext();

		loop(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'loop',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			memory: context.namespace.memory,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('compiles the loop segment with explicit cap argument', () => {
		const context = createInstructionCompilerTestContext();

		loop(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'loop',
				arguments: [{ type: ArgumentType.LITERAL, value: 32, isInteger: true }],
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			memory: context.namespace.memory,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('uses context.loopCap when no argument is provided', () => {
		const context = createInstructionCompilerTestContext();
		context.loopCap = 500;

		loop(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'loop',
				arguments: [],
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			memory: context.namespace.memory,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('explicit argument overrides context.loopCap', () => {
		const context = createInstructionCompilerTestContext();
		context.loopCap = 500;

		loop(
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'loop',
				arguments: [{ type: ArgumentType.LITERAL, value: 10, isInteger: true }],
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			memory: context.namespace.memory,
			locals: context.locals,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
