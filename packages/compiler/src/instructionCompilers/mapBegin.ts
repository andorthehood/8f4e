import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `mapBegin`.
 * Opens a map block scope and records the input type for the mapping operation.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const mapBegin: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minArguments: 1,
	},
	(line, context) => {
		if (line.arguments[0].type !== ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		const inputType = line.arguments[0].value;
		if (inputType !== 'int' && inputType !== 'float' && inputType !== 'float64') {
			throw getError(ErrorCode.TYPE_MISMATCH, line, context);
		}

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

	describe('mapBegin instruction compiler', () => {
		it('opens a map block for int input type', () => {
			const context = createInstructionCompilerTestContext();

			mapBegin(
				{
					lineNumber: 1,
					instruction: 'mapBegin',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'int' }],
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
					lineNumber: 1,
					instruction: 'mapBegin',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'float' }],
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
					lineNumber: 1,
					instruction: 'mapBegin',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'float64' }],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
			}).toMatchSnapshot();
		});

		it('throws on missing argument', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				mapBegin({ lineNumber: 1, instruction: 'mapBegin', arguments: [] } as AST[number], context);
			}).toThrowError();
		});

		it('throws on unknown type', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				mapBegin(
					{
						lineNumber: 1,
						instruction: 'mapBegin',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'unknown' }],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}
