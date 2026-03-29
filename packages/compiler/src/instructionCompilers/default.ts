import { ArgumentType, BLOCK_TYPE } from '../types';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler, NormalizedDefaultLine } from '../types';

/**
 * Instruction compiler for `default`.
 * Records an explicit default value within a map block. No bytecode is emitted;
 * lowering happens at `mapEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const _default: InstructionCompiler<NormalizedDefaultLine> = withValidation<NormalizedDefaultLine>(
	{
		scope: 'map',
		allowedInMapBlocks: true,
	},
	(line: NormalizedDefaultLine, context) => {
		const mapState = context.blockStack[context.blockStack.length - 1].mapState!;

		const valueArg = line.arguments[0];
		const defaultValue = valueArg.value;
		const defaultIsInteger = valueArg.isInteger;
		const defaultIsFloat64 = !!valueArg.isFloat64;

		mapState.defaultValue = defaultValue;
		mapState.defaultIsInteger = defaultIsInteger;
		mapState.defaultIsFloat64 = defaultIsFloat64;
		mapState.defaultSet = true;

		return context;
	}
);

export default _default;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('default instruction compiler', () => {
		it('records a default value', () => {
			const context = createInstructionCompilerTestContext({
				blockStack: [
					{
						blockType: BLOCK_TYPE.MODULE,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
					},
					{
						blockType: BLOCK_TYPE.MAP,
						expectedResultIsInteger: false,
						hasExpectedResult: false,
						mapState: { inputIsInteger: true, inputIsFloat64: false, rows: [], defaultSet: false },
					},
				],
			});

			_default(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'default',
					arguments: [{ type: ArgumentType.LITERAL, value: 99, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				mapState: context.blockStack[context.blockStack.length - 1].mapState,
			}).toMatchSnapshot();
		});

		it('throws when used outside a map block', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				_default(
					{
						lineNumberBeforeMacroExpansion: 1,
						lineNumberAfterMacroExpansion: 1,
						instruction: 'default',
						arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}
