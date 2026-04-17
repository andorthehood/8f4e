import { describe, expect, it } from 'vitest';

import block from './block';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '../types';

describe('block instruction compiler', () => {
	it('emits a typed block for float', () => {
		const context = createInstructionCompilerTestContext();

		block(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'block',
				arguments: [],
				blockBlock: { matchingBlockEndIndex: 2, resultType: 'float' },
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits a typed block for int', () => {
		const context = createInstructionCompilerTestContext();

		block(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'block',
				arguments: [],
				blockBlock: { matchingBlockEndIndex: 2, resultType: 'int' },
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits a void block when no result type is declared', () => {
		const context = createInstructionCompilerTestContext();

		block(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'block',
				arguments: [],
				blockBlock: { matchingBlockEndIndex: 2, resultType: null },
			} as AST[number],
			context
		);

		expect({
			blockStack: context.blockStack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
