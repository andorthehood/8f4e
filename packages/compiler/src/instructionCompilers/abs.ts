import {
	i32const,
	localGet,
	localSet,
	WASM_ELSE,
	WASM_END,
	WASM_F32_ABS,
	WASM_F64_ABS,
	WASM_I32_LT_S,
	WASM_I32_SUB,
	WASM_IF,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `abs`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const abs: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 1 operand exists
	const operand = context.stack.pop()!;

	if (operand.isInteger) {
		const valueName = '__absify_value' + line.lineNumberAfterMacroExpansion;
		const valueLocalIndex = Object.keys(context.locals).length;

		context.locals[valueName] = {
			isInteger: true,
			index: valueLocalIndex,
		};
		context.stack.push({ isInteger: true, isNonZero: false });

		return saveByteCode(context, [
			...localSet(valueLocalIndex),
			...localGet(valueLocalIndex),
			...i32const(0),
			WASM_I32_LT_S,
			WASM_IF,
			WASM_TYPE_I32,
			...i32const(0),
			...localGet(valueLocalIndex),
			WASM_I32_SUB,
			WASM_ELSE,
			...localGet(valueLocalIndex),
			WASM_END,
		]);
	} else {
		context.stack.push({
			isInteger: false,
			...(operand.isFloat64 ? { isFloat64: true } : {}),
			isNonZero: operand.isNonZero,
		});
		return saveByteCode(context, [operand.isFloat64 ? WASM_F64_ABS : WASM_F32_ABS]);
	}
};

export default abs;
