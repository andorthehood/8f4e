import { describe, expect, it } from 'vitest';

import branch from './branch';

import { ArgumentType } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('branch instruction compiler', () => {
	it('emits br bytecode', () => {
		const context = createInstructionCompilerTestContext();

		branch(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'branch',
				arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
			} as AST[number],
			context
		);

		expect({
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
