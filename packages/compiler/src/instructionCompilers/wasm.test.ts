import { describe, expect, it } from 'vitest';

import wasm from './wasm';

import { ArgumentType } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('wasm instruction compiler', () => {
	it('emits the provided wasm opcode', () => {
		const context = createInstructionCompilerTestContext();

		wasm(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'wasm',
				arguments: [{ type: ArgumentType.LITERAL, value: 42, isInteger: true }],
			} as AST[number],
			context
		);

		expect({
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
