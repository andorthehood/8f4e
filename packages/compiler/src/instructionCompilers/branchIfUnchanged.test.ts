import { describe, expect, it } from 'vitest';

import branchIfUnchanged from './branchIfUnchanged';

import { ArgumentType } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('branchIfUnchanged instruction compiler', () => {
	it('compiles the unchanged check segment', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true });

		branchIfUnchanged(
			{
				lineNumberBeforeMacroExpansion: 4,
				lineNumberAfterMacroExpansion: 4,
				instruction: 'branchIfUnchanged',
				arguments: [{ type: ArgumentType.LITERAL, value: 1, isInteger: true }],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
			memory: context.namespace.memory,
			locals: context.locals,
		}).toMatchSnapshot();
	});
});
