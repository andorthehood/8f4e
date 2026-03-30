import { BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler, MapBeginLine } from '../types';

/**
 * Instruction compiler for `mapBegin`.
 * Opens a map block scope and records the input type for the mapping operation.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const mapBegin: InstructionCompiler<MapBeginLine> = withValidation<MapBeginLine>(
	{
		scope: 'moduleOrFunction',
	},
	(line: MapBeginLine, context) => {
		const inputType = line.arguments[0].value;

		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.MAP,
			mapState: {
				inputIsInteger: inputType === 'int',
				inputIsFloat64: inputType === 'float64',
				rows: [],
				defaultSet: false,
			},
		});

		return context;
	}
);

export default mapBegin;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('mapBegin instruction compiler', () => {
		it('opens a map block for int input type', () => {
			const context = createInstructionCompilerTestContext();

			mapBegin(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'mapBegin',
					arguments: [classifyIdentifier('int')],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
			}).toMatchSnapshot();
		});

		it('opens a map block for float input type', () => {
			const context = createInstructionCompilerTestContext();

			mapBegin(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'mapBegin',
					arguments: [classifyIdentifier('float')],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
			}).toMatchSnapshot();
		});

		it('opens a map block for float64 input type', () => {
			const context = createInstructionCompilerTestContext();

			mapBegin(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'mapBegin',
					arguments: [classifyIdentifier('float64')],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
			}).toMatchSnapshot();
		});
	});
}
