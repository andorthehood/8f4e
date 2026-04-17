import { describe, expect, it } from 'vitest';

import branchIfTrue from './branchIfTrue';

import { ArgumentType } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('branchIfTrue instruction compiler', () => {
	it('emits br_if bytecode', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true });

		branchIfTrue(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'branchIfTrue',
				arguments: [{ type: ArgumentType.LITERAL, value: 2, isInteger: true }],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
