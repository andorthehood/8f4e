import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `default`.
 * Records an explicit default value within a map block. No bytecode is emitted;
 * lowering happens at `mapEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const _default: InstructionCompiler = withValidation(
	{
		scope: 'map',
		allowedInMapBlocks: true,
		minArguments: 1,
	},
	(line, context) => {
		const mapState = context.blockStack[context.blockStack.length - 1].mapState!;

		const valueArg = line.arguments[0];
		let defaultValue: number;
		let defaultIsInteger: boolean;
		let defaultIsFloat64 = false;

		if (valueArg.type === ArgumentType.LITERAL) {
			defaultValue = valueArg.value;
			defaultIsInteger = valueArg.isInteger;
			defaultIsFloat64 = !!valueArg.isFloat64;
		} else {
			const c = context.namespace.consts[valueArg.value];
			if (c === undefined) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}
			defaultValue = c.value;
			defaultIsInteger = c.isInteger;
			defaultIsFloat64 = !!c.isFloat64;
		}

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
					lineNumber: 1,
					instruction: 'default',
					arguments: [{ type: ArgumentType.LITERAL, value: 99, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				mapState: context.blockStack[context.blockStack.length - 1].mapState,
			}).toMatchSnapshot();
		});

		it('throws on missing argument', () => {
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

			expect(() => {
				_default({ lineNumber: 1, instruction: 'default', arguments: [] } as AST[number], context);
			}).toThrowError();
		});

		it('throws when used outside a map block', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				_default(
					{
						lineNumber: 1,
						instruction: 'default',
						arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}
