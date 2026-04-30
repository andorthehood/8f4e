import { describe, expect, it } from 'vitest';
import { ArgumentType } from '@8f4e/compiler-types';

import branchIfUnchanged from './branchIfUnchanged';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

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
