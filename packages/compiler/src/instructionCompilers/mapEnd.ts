import type { InstructionCompiler, MapEndLine } from '@8f4e/compiler-spec';
import type { WASMInstructionCode } from '@8f4e/compiler-wasm-utils';
import {
	f32const,
	f64const,
	i32const,
	localGet,
	localSet,
	WASM_DROP,
	WASM_F32_EQ,
	WASM_F64_EQ,
	WASM_I32_AND,
	WASM_I32_EQ,
	WASM_I32_EQZ,
	WASM_I32_OR,
	WASM_SELECT,
} from '@8f4e/compiler-wasm-utils';
import { popMapBlock } from '../utils/blockStack';
import type { MapKind } from '../utils/mapValueKind';
import { resolveMapKind } from '../utils/mapValueKind';
import { saveByteCode } from './utils/saveByteCode';

const constOp: Record<MapKind, (v: number) => number[]> = {
	int32: i32const,
	float32: f32const,
	float64: f64const,
};

const eqOpcode: Record<MapKind, WASMInstructionCode> = {
	int32: WASM_I32_EQ,
	float32: WASM_F32_EQ,
	float64: WASM_F64_EQ,
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
const mapEnd: InstructionCompiler<MapEndLine> = (line: MapEndLine, context) => {
	const outputType = line.arguments[0].value;
	const outputIsInteger = outputType === 'int';
	const outputIsFloat64 = outputType === 'float64';
	const outputKind = resolveMapKind({ valueType: outputIsInteger ? 'int' : outputIsFloat64 ? 'float64' : 'float' });

	const { mapState } = popMapBlock(context);

	const inputKind = resolveMapKind({
		valueType: mapState.inputIsInteger ? 'int' : mapState.inputIsFloat64 ? 'float64' : 'float',
	});

	const rows = mapState.rows;
	const hasDefault = mapState.defaultSet;
	const defaultValue = hasDefault ? mapState.defaultValue! : 0;

	const inputIsFloat64 = mapState.inputIsFloat64;
	const inputIsInteger = mapState.inputIsInteger;

	if (rows.length === 0) {
		// No rows: discard the input and push the default/zero value
		saveByteCode(context, [WASM_DROP, ...constOp[outputKind](defaultValue)]);
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
				WASM_I32_EQZ,
				WASM_I32_AND,
				// select(value, resultLocal, apply)
				WASM_SELECT,
				// Update resultLocal
				...localSet(resultLocalIdx),
				// Update matchedLocal = matchedLocal OR cond
				...localGet(matchedLocalIdx),
				...localGet(condLocalIdx),
				WASM_I32_OR,
				...localSet(matchedLocalIdx),
			]);
		}

		// Step 5: push the final result
		saveByteCode(context, localGet(resultLocalIdx));
	}

	return context;
};

export default mapEnd;
