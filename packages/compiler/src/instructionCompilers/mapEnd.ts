import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import i32const from '../wasmUtils/const/i32const';
import f32const from '../wasmUtils/const/f32const';
import f64const from '../wasmUtils/const/f64const';
import localGet from '../wasmUtils/local/localGet';
import localSet from '../wasmUtils/local/localSet';
import { saveByteCode } from '../utils/compilation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

type MapKind = 'int32' | 'float32' | 'float64';

const constOp: Record<MapKind, (v: number) => number[]> = {
	int32: i32const,
	float32: f32const,
	float64: f64const,
};

const eqOpcode: Record<MapKind, WASMInstruction> = {
	int32: WASMInstruction.I32_EQ,
	float32: WASMInstruction.F32_EQ,
	float64: WASMInstruction.F64_EQ,
};

/**
 * Instruction compiler for `mapEnd`.
 * Closes a map block and emits branchless WebAssembly `select`-based lowering for
 * all collected mapping rows. Consumes the input value from the stack and pushes
 * the mapped result.
 *
 * Lowering algorithm (first-match-wins, branchless):
 * 1. Pop input into `inputLocal`.
 * 2. Initialise `resultLocal` to explicit default or typed zero.
 * 3. Initialise `matchedLocal` (i32) to 0.
 * 4. For each row (key, value):
 *    - cond = (inputLocal == key)
 *    - apply = cond AND (matchedLocal == 0)
 *    - resultLocal = select(value, resultLocal, apply)
 *    - matchedLocal = matchedLocal OR cond
 * 5. Push `resultLocal`.
 *
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const mapEnd: InstructionCompiler = withValidation(
	{
		scope: 'map',
		allowedInMapBlocks: true,
		minOperands: 1,
	},
	(line, context) => {
		if (!line.arguments[0] || line.arguments[0].type !== ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		const outputType = line.arguments[0].value;
		if (outputType !== 'int' && outputType !== 'float' && outputType !== 'float64') {
			throw getError(ErrorCode.TYPE_MISMATCH, line, context);
		}

		const outputIsInteger = outputType === 'int';
		const outputIsFloat64 = outputType === 'float64';
		const outputKind: MapKind = outputIsInteger ? 'int32' : outputIsFloat64 ? 'float64' : 'float32';

		// Validate the input stack operand matches the declared inputType
		const inputOperand = context.stack[context.stack.length - 1];
		if (context.mapInputIsFloat64) {
			if (inputOperand.isInteger || !inputOperand.isFloat64) {
				throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
			}
		} else if (context.mapInputIsInteger) {
			if (!inputOperand.isInteger) {
				throw getError(ErrorCode.ONLY_INTEGERS, line, context);
			}
		} else {
			// float32
			if (inputOperand.isInteger) {
				throw getError(ErrorCode.ONLY_FLOATS, line, context);
			}
			if (inputOperand.isFloat64) {
				throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
			}
		}

		const rows = context.mapRows!;
		const hasDefault = context.mapDefaultSet === true;
		const defaultValue = hasDefault ? context.mapDefaultValue! : 0;
		const defaultIsInteger = hasDefault ? !!context.mapDefaultIsInteger : true;
		const defaultIsFloat64 = hasDefault ? !!context.mapDefaultIsFloat64 : false;

		// Validate value types for each row against outputType
		for (const row of rows) {
			if (outputIsFloat64) {
				if (!row.valueIsFloat64) {
					throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
				}
			} else if (outputIsInteger) {
				if (!row.valueIsInteger) {
					throw getError(ErrorCode.ONLY_INTEGERS, line, context);
				}
			} else {
				// float32
				if (row.valueIsInteger) {
					throw getError(ErrorCode.ONLY_FLOATS, line, context);
				}
				if (row.valueIsFloat64) {
					throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
				}
			}
		}

		// Validate explicit default type against outputType
		if (hasDefault) {
			if (outputIsFloat64) {
				if (!defaultIsFloat64) {
					throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
				}
			} else if (outputIsInteger) {
				if (!defaultIsInteger) {
					throw getError(ErrorCode.ONLY_INTEGERS, line, context);
				}
			} else {
				// float32
				if (defaultIsInteger) {
					throw getError(ErrorCode.ONLY_FLOATS, line, context);
				}
				if (defaultIsFloat64) {
					throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
				}
			}
		}

		// Pop the MAP block from blockStack
		const block = context.blockStack.pop();
		if (!block || block.blockType !== BLOCK_TYPE.MAP) {
			throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
		}

		// Pop the input operand from the logical stack
		context.stack.pop();

		// Determine input kind for the equality opcode
		const inputIsFloat64 = context.mapInputIsFloat64 === true;
		const inputIsInteger = context.mapInputIsInteger === true;
		const inputKind: MapKind = inputIsInteger ? 'int32' : inputIsFloat64 ? 'float64' : 'float32';

		// Clear map state
		context.mapRows = undefined;
		context.mapDefaultValue = undefined;
		context.mapDefaultIsInteger = undefined;
		context.mapDefaultIsFloat64 = undefined;
		context.mapDefaultSet = undefined;
		context.mapInputIsInteger = undefined;
		context.mapInputIsFloat64 = undefined;

		if (rows.length === 0) {
			// No rows: discard the input and push the default/zero value
			saveByteCode(context, [WASMInstruction.DROP]);
			saveByteCode(context, constOp[outputKind](defaultValue));
		} else {
			// Allocate four temporary locals: inputLocal, resultLocal, matchedLocal, condLocal
			const localBase = Object.keys(context.namespace.locals).length;

			context.namespace.locals[`__map_${localBase}_input`] = {
				isInteger: inputIsInteger,
				...(inputIsFloat64 ? { isFloat64: true } : {}),
				index: localBase,
			};
			context.namespace.locals[`__map_${localBase}_result`] = {
				isInteger: outputIsInteger,
				...(outputIsFloat64 ? { isFloat64: true } : {}),
				index: localBase + 1,
			};
			context.namespace.locals[`__map_${localBase}_matched`] = {
				isInteger: true,
				index: localBase + 2,
			};
			context.namespace.locals[`__map_${localBase}_cond`] = {
				isInteger: true,
				index: localBase + 3,
			};

			const inputLocalIdx = localBase;
			const resultLocalIdx = localBase + 1;
			const matchedLocalIdx = localBase + 2;
			const condLocalIdx = localBase + 3;

			// Step 1: save input to inputLocal (pops from WASM stack)
			saveByteCode(context, localSet(inputLocalIdx));

			// Step 2: initialise resultLocal to default or typed zero
			saveByteCode(context, constOp[outputKind](defaultValue));
			saveByteCode(context, localSet(resultLocalIdx));

			// Step 3: initialise matchedLocal to 0
			saveByteCode(context, i32const(0));
			saveByteCode(context, localSet(matchedLocalIdx));

			// Step 4: emit one select-based update per row
			for (const row of rows) {
				// Push the candidate value for this row
				saveByteCode(context, constOp[outputKind](row.valueValue));
				// Push current resultLocal
				saveByteCode(context, localGet(resultLocalIdx));
				// Compute cond = (inputLocal == key)
				saveByteCode(context, localGet(inputLocalIdx));
				saveByteCode(context, constOp[inputKind](row.keyValue));
				saveByteCode(context, [eqOpcode[inputKind]]);
				// Save cond for re-use
				saveByteCode(context, localSet(condLocalIdx));
				// Compute apply = cond AND !matchedLocal
				saveByteCode(context, localGet(condLocalIdx));
				saveByteCode(context, localGet(matchedLocalIdx));
				saveByteCode(context, [WASMInstruction.I32_EQZ]);
				saveByteCode(context, [WASMInstruction.I32_AND]);
				// select(value, resultLocal, apply)
				saveByteCode(context, [WASMInstruction.SELECT]);
				// Update resultLocal
				saveByteCode(context, localSet(resultLocalIdx));
				// Update matchedLocal = matchedLocal OR cond
				saveByteCode(context, localGet(matchedLocalIdx));
				saveByteCode(context, localGet(condLocalIdx));
				saveByteCode(context, [WASMInstruction.I32_OR]);
				saveByteCode(context, localSet(matchedLocalIdx));
			}

			// Step 5: push the final result
			saveByteCode(context, localGet(resultLocalIdx));
		}

		// Push the result onto the logical stack
		context.stack.push({
			isInteger: outputIsInteger,
			...(outputIsFloat64 ? { isFloat64: true } : {}),
		});

		return context;
	}
);

export default mapEnd;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('mapEnd instruction compiler', () => {
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
					},
				],
				mapInputIsInteger: true,
				mapInputIsFloat64: false,
				mapRows: [],
				mapDefaultSet: false,
			});
			context.stack.push({ isInteger: true });

			expect(() => {
				mapEnd({ lineNumber: 1, instruction: 'mapEnd', arguments: [] } as AST[number], context);
			}).toThrowError();
		});

		it('throws when used outside a map block', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true });

			expect(() => {
				mapEnd(
					{
						lineNumber: 1,
						instruction: 'mapEnd',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'int' }],
					} as AST[number],
					context
				);
			}).toThrowError();
		});

		it('emits DROP + typed zero for zero rows', () => {
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
			context.stack.push({ isInteger: true });

			mapEnd(
				{
					lineNumber: 1,
					instruction: 'mapEnd',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'int' }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
				blockStack: context.blockStack,
			}).toMatchSnapshot();
		});
	});
}
