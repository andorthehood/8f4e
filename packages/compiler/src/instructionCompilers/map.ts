import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../compilerError';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler, NormalizedMapLine } from '../types';

/**
 * Instruction compiler for `map`.
 * Records a key→value mapping entry within a map block. No bytecode is emitted;
 * lowering happens at `mapEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const map: InstructionCompiler<NormalizedMapLine> = withValidation<NormalizedMapLine>(
	{
		scope: 'map',
		allowedInMapBlocks: true,
	},
	(line: NormalizedMapLine, context) => {
		const mapState = context.blockStack[context.blockStack.length - 1].mapState!;
		const keyArg = line.arguments[0];
		const valueArg = line.arguments[1];

		// Resolve key argument
		// The semantic pass (normalizeCompileTimeArguments) guarantees keyArg is LITERAL or STRING_LITERAL.
		let keyValue: number;
		let keyIsInteger: boolean;
		let keyIsFloat64 = false;

		if (keyArg.type === ArgumentType.LITERAL) {
			keyValue = keyArg.value;
			keyIsInteger = keyArg.isInteger;
			keyIsFloat64 = !!keyArg.isFloat64;
		} else {
			keyValue = keyArg.value.charCodeAt(0);
			keyIsInteger = true;
		}

		// Validate key type against the declared inputType
		if (mapState.inputIsFloat64) {
			if (keyIsInteger) {
				throw getError(ErrorCode.ONLY_FLOATS, line, context);
			}
			if (!keyIsFloat64) {
				throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
			}
		} else if (mapState.inputIsInteger) {
			if (!keyIsInteger) {
				throw getError(ErrorCode.ONLY_INTEGERS, line, context);
			}
		} else {
			// float32
			if (keyIsInteger) {
				throw getError(ErrorCode.ONLY_FLOATS, line, context);
			}
			if (keyIsFloat64) {
				throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
			}
		}

		// Resolve value argument (type is validated at mapEnd when outputType is known)
		let valueValue = 0;
		let valueIsInteger = false;
		let valueIsFloat64 = false;

		if (valueArg.type === ArgumentType.LITERAL) {
			valueValue = valueArg.value;
			valueIsInteger = valueArg.isInteger;
			valueIsFloat64 = !!valueArg.isFloat64;
		} else {
			valueValue = valueArg.value.charCodeAt(0);
			valueIsInteger = true;
		}

		mapState.rows.push({ keyValue, valueValue, valueIsInteger, valueIsFloat64 });

		return context;
	}
);

export default map;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('map instruction compiler', () => {
		it('records an int key→int value row', () => {
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

			map(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'map',
					arguments: [
						{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
						{ type: ArgumentType.LITERAL, value: 100, isInteger: true },
					],
				} as AST[number],
				context
			);

			expect(context.blockStack[context.blockStack.length - 1].mapState!.rows).toMatchSnapshot();
		});

		it('accepts single-character string literals as ASCII int key/value', () => {
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

			map(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'map',
					arguments: [
						{ type: ArgumentType.STRING_LITERAL, value: 'A' },
						{ type: ArgumentType.STRING_LITERAL, value: 'B' },
					],
				} as AST[number],
				context
			);

			expect(context.blockStack[context.blockStack.length - 1].mapState!.rows).toEqual([
				{ keyValue: 65, valueValue: 66, valueIsInteger: true, valueIsFloat64: false },
			]);
		});

		it('throws when key type mismatches int inputType', () => {
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
				map(
					{
						lineNumberBeforeMacroExpansion: 1,
						lineNumberAfterMacroExpansion: 1,
						instruction: 'map',
						arguments: [
							{ type: ArgumentType.LITERAL, value: 1.5, isInteger: false },
							{ type: ArgumentType.LITERAL, value: 100, isInteger: true },
						],
					} as AST[number],
					context
				);
			}).toThrowError();
		});

		it('throws when used outside a map block', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				map(
					{
						lineNumberBeforeMacroExpansion: 1,
						lineNumberAfterMacroExpansion: 1,
						instruction: 'map',
						arguments: [
							{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
							{ type: ArgumentType.LITERAL, value: 100, isInteger: true },
						],
					} as AST[number],
					context
				);
			}).toThrowError();
		});
	});
}
