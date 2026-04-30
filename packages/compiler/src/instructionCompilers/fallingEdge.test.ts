import { describe, expect, it } from 'vitest';

import fallingEdge from './fallingEdge';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

describe('fallingEdge instruction compiler', () => {
	it('compiles the falling edge segment', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false });

		fallingEdge(
			{
				lineNumberBeforeMacroExpansion: 5,
				lineNumberAfterMacroExpansion: 5,
				instruction: 'fallingEdge',
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
