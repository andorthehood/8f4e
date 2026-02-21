import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';
import { BLOCK_TYPE } from '../types';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `map`.
 * Records a key→value mapping entry within a map block. No bytecode is emitted;
 * lowering happens at `mapEnd`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const map: InstructionCompiler = withValidation(
	{
		scope: 'map',
		allowedInMapBlocks: true,
	},
	(line, context) => {
		if (!line.arguments[0] || !line.arguments[1]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		// Resolve key argument
		const keyArg = line.arguments[0];
		let keyValue: number;
		let keyIsInteger: boolean;
		let keyIsFloat64 = false;

		if (keyArg.type === ArgumentType.LITERAL) {
			keyValue = keyArg.value;
			keyIsInteger = keyArg.isInteger;
			keyIsFloat64 = !!keyArg.isFloat64;
		} else {
			const c = context.namespace.consts[keyArg.value];
			if (c === undefined) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}
			keyValue = c.value;
			keyIsInteger = c.isInteger;
			keyIsFloat64 = !!c.isFloat64;
		}

		// Validate key type against the declared inputType
		if (context.mapInputIsFloat64) {
			if (!keyIsFloat64) {
				throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
			}
		} else if (context.mapInputIsInteger) {
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
		const valueArg = line.arguments[1];
		let valueValue: number;
		let valueIsInteger: boolean;
		let valueIsFloat64 = false;

		if (valueArg.type === ArgumentType.LITERAL) {
			valueValue = valueArg.value;
			valueIsInteger = valueArg.isInteger;
			valueIsFloat64 = !!valueArg.isFloat64;
		} else {
			const c = context.namespace.consts[valueArg.value];
			if (c === undefined) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}
			valueValue = c.value;
			valueIsInteger = c.isInteger;
			valueIsFloat64 = !!c.isFloat64;
		}

		context.mapRows!.push({ keyValue, valueValue, valueIsInteger, valueIsFloat64 });

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
					},
				],
				mapInputIsInteger: true,
				mapInputIsFloat64: false,
				mapRows: [],
				mapDefaultSet: false,
			});

			map(
				{
					lineNumber: 1,
					instruction: 'map',
					arguments: [
						{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
						{ type: ArgumentType.LITERAL, value: 100, isInteger: true },
					],
				} as AST[number],
				context
			);

			expect(context.mapRows).toMatchSnapshot();
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
					},
				],
				mapInputIsInteger: true,
				mapInputIsFloat64: false,
				mapRows: [],
				mapDefaultSet: false,
			});

			expect(() => {
				map(
					{
						lineNumber: 1,
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

		it('throws on missing arguments', () => {
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
					},
				],
				mapInputIsInteger: true,
				mapInputIsFloat64: false,
				mapRows: [],
				mapDefaultSet: false,
			});

			expect(() => {
				map({ lineNumber: 1, instruction: 'map', arguments: [] } as AST[number], context);
			}).toThrowError();
		});

		it('throws when used outside a map block', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				map(
					{
						lineNumber: 1,
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
