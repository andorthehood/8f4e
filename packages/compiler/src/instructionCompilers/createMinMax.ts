import {
	localGet,
	localSet,
	WASM_ELSE,
	WASM_END,
	WASM_F32_MAX,
	WASM_F32_MIN,
	WASM_F64_MAX,
	WASM_F64_MIN,
	WASM_I32_GT_S,
	WASM_I32_LT_S,
	WASM_IF,
	WASM_TYPE_I32,
} from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import { areAllOperandsFloat64, areAllOperandsIntegers } from '../utils/operandTypes';

import type { InstructionCompiler } from '@8f4e/compiler-spec';

const createMinMax =
	(instruction: 'min' | 'max'): InstructionCompiler =>
	(line, context) => {
		// Non-null assertion is safe: instruction validation ensures 2 operands exist
		const operand2 = context.stack.pop()!;
		const operand1 = context.stack.pop()!;

		const isInteger = areAllOperandsIntegers(operand1, operand2);
		const isFloat64 = areAllOperandsFloat64(operand1, operand2);

		if (isInteger) {
			const leftName = `__${instruction}_left${line.lineNumberAfterMacroExpansion}`;
			const rightName = `__${instruction}_right${line.lineNumberAfterMacroExpansion}`;
			const leftLocalIndex = Object.keys(context.locals).length;
			const rightLocalIndex = leftLocalIndex + 1;

			context.locals[leftName] = {
				isInteger: true,
				index: leftLocalIndex,
			};
			context.locals[rightName] = {
				isInteger: true,
				index: rightLocalIndex,
			};
			context.stack.push({ isInteger: true, isNonZero: false });

			return saveByteCode(context, [
				...localSet(rightLocalIndex),
				...localSet(leftLocalIndex),
				...localGet(leftLocalIndex),
				...localGet(rightLocalIndex),
				instruction === 'min' ? WASM_I32_LT_S : WASM_I32_GT_S,
				WASM_IF,
				WASM_TYPE_I32,
				...localGet(leftLocalIndex),
				WASM_ELSE,
				...localGet(rightLocalIndex),
				WASM_END,
			]);
		}

		context.stack.push({
			isInteger: false,
			...(isFloat64 ? { isFloat64: true } : {}),
			isNonZero: false,
		});

		if (instruction === 'min') {
			return saveByteCode(context, [isFloat64 ? WASM_F64_MIN : WASM_F32_MIN]);
		}

		return saveByteCode(context, [isFloat64 ? WASM_F64_MAX : WASM_F32_MAX]);
	};

export default createMinMax;
