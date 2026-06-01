import type { InstructionCompiler } from '@8f4e/compiler-spec';
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

import { areAllOperandsFloat64, areAllOperandsIntegers } from '../utils/operandTypes';
import { saveByteCode } from './utils/saveByteCode';

const createMinMax =
	(instruction: 'min' | 'max'): InstructionCompiler =>
	(line, context) => {
		const [operand1, operand2] = line.stackAnalysis.consumedOperands;
		const isInteger = areAllOperandsIntegers(operand1, operand2);
		const isFloat64 = areAllOperandsFloat64(operand1, operand2);

		if (isInteger) {
			const leftName = `__${instruction}_left${line.lineNumber}`;
			const rightName = `__${instruction}_right${line.lineNumber}`;
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

		if (instruction === 'min') {
			return saveByteCode(context, [isFloat64 ? WASM_F64_MIN : WASM_F32_MIN]);
		}

		return saveByteCode(context, [isFloat64 ? WASM_F64_MAX : WASM_F32_MAX]);
	};

export default createMinMax;
