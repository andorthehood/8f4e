import { WASMInstruction, f32const, f64const, i32const, localGet, localSet } from '@8f4e/compiler-wasm-utils';

import { ErrorCode, getError } from '../compilerError';
import { BLOCK_TYPE } from '../types';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, MapEndLine } from '../types';

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
const mapEnd: InstructionCompiler<MapEndLine> = withValidation<MapEndLine>(
	{
		scope: 'map',
		allowedInMapBlocks: true,
		minOperands: 1,
	},
	(line: MapEndLine, context) => {
		const outputType = line.arguments[0].value;
		const outputIsInteger = outputType === 'int';
		const outputIsFloat64 = outputType === 'float64';
		const outputKind: MapKind = outputIsInteger ? 'int32' : outputIsFloat64 ? 'float64' : 'float32';

		// Pop the MAP block from blockStack and read its state
		const block = context.blockStack.pop();
		if (!block || block.blockType !== BLOCK_TYPE.MAP || !block.mapState) {
			throw getError(ErrorCode.MISSING_BLOCK_START_INSTRUCTION, line, context);
		}
		const mapState = block.mapState;

		// Validate the input stack operand matches the declared inputType
		const inputOperand = context.stack[context.stack.length - 1];
		if (mapState.inputIsFloat64) {
			if (inputOperand.isInteger) {
				throw getError(ErrorCode.ONLY_FLOATS, line, context);
			}
			if (!inputOperand.isFloat64) {
				throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
			}
		} else if (mapState.inputIsInteger) {
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

		const rows = mapState.rows;
		const hasDefault = mapState.defaultSet;
		const defaultValue = hasDefault ? mapState.defaultValue! : 0;
		const defaultIsInteger = hasDefault ? !!mapState.defaultIsInteger : true;
		const defaultIsFloat64 = hasDefault ? !!mapState.defaultIsFloat64 : false;

		// Validate value types for each row against outputType
		for (const row of rows) {
			if (outputIsFloat64) {
				if (row.valueIsInteger) {
					throw getError(ErrorCode.ONLY_FLOATS, line, context);
				}
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
				if (defaultIsInteger) {
					throw getError(ErrorCode.ONLY_FLOATS, line, context);
				}
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

		// Pop the input operand from the logical stack
		context.stack.pop();

		// Determine input kind for the equality opcode
		const inputIsFloat64 = mapState.inputIsFloat64;
		const inputIsInteger = mapState.inputIsInteger;
		const inputKind: MapKind = inputIsInteger ? 'int32' : inputIsFloat64 ? 'float64' : 'float32';

		if (rows.length === 0) {
			// No rows: discard the input and push the default/zero value
			saveByteCode(context, [WASMInstruction.DROP, ...constOp[outputKind](defaultValue)]);
		} else {
			// Allocate four temporary locals: inputLocal, resultLocal, matchedLocal, condLocal
			const localBase = Object.keys(context.locals).length;

			context.locals[`__map_${localBase}_input`] = {
				isInteger: inputIsInteger,
				...(inputIsFloat64 ? { isFloat64: true } : {}),
				index: localBase,
			};
			context.locals[`__map_${localBase}_result`] = {
				isInteger: outputIsInteger,
				...(outputIsFloat64 ? { isFloat64: true } : {}),
				index: localBase + 1,
			};
			context.locals[`__map_${localBase}_matched`] = {
				isInteger: true,
				index: localBase + 2,
			};
			context.locals[`__map_${localBase}_cond`] = {
				isInteger: true,
				index: localBase + 3,
			};

			const inputLocalIdx = localBase;
			const resultLocalIdx = localBase + 1;
			const matchedLocalIdx = localBase + 2;
			const condLocalIdx = localBase + 3;

			// Step 1: save input; Step 2: init resultLocal; Step 3: init matchedLocal
			saveByteCode(context, [
				...localSet(inputLocalIdx),
				...constOp[outputKind](defaultValue),
				...localSet(resultLocalIdx),
				...i32const(0),
				...localSet(matchedLocalIdx),
			]);

			// Step 4: emit one select-based update per row
			for (const row of rows) {
				saveByteCode(context, [
					// Push the candidate value for this row
					...constOp[outputKind](row.valueValue),
					// Push current resultLocal
					...localGet(resultLocalIdx),
					// Compute cond = (inputLocal == key)
					...localGet(inputLocalIdx),
					...constOp[inputKind](row.keyValue),
					eqOpcode[inputKind],
					// Save cond for re-use
					...localSet(condLocalIdx),
					// Compute apply = cond AND !matchedLocal
					...localGet(condLocalIdx),
					...localGet(matchedLocalIdx),
					WASMInstruction.I32_EQZ,
					WASMInstruction.I32_AND,
					// select(value, resultLocal, apply)
					WASMInstruction.SELECT,
					// Update resultLocal
					...localSet(resultLocalIdx),
					// Update matchedLocal = matchedLocal OR cond
					...localGet(matchedLocalIdx),
					...localGet(condLocalIdx),
					WASMInstruction.I32_OR,
					...localSet(matchedLocalIdx),
				]);
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
