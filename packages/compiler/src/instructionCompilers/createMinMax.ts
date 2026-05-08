import { localGet, localSet, Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { ErrorCode, getError } from '../compilerError';
import { saveByteCode } from '../utils/compilation';
import { areAllOperandsFloat64, areAllOperandsIntegers, hasMixedFloatWidth } from '../utils/operandTypes';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '@8f4e/compiler-types';

const createMinMax = (instruction: 'min' | 'max'): InstructionCompiler =>
	withValidation(
		{
			scope: 'moduleOrFunction',
			minOperands: 2,
			operandTypes: 'matching',
		},
		(line, context) => {
			// Non-null assertion is safe: withValidation ensures 2 operands exist
			const operand2 = context.stack.pop()!;
			const operand1 = context.stack.pop()!;

			if (hasMixedFloatWidth(operand1, operand2)) {
				throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
			}

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
					instruction === 'min' ? WASMInstruction.I32_LT_S : WASMInstruction.I32_GT_S,
					WASMInstruction.IF,
					Type.I32,
					...localGet(leftLocalIndex),
					WASMInstruction.ELSE,
					...localGet(rightLocalIndex),
					WASMInstruction.END,
				]);
			}

			context.stack.push({
				isInteger: false,
				...(isFloat64 ? { isFloat64: true } : {}),
				isNonZero: false,
			});

			if (instruction === 'min') {
				return saveByteCode(context, [isFloat64 ? WASMInstruction.F64_MIN : WASMInstruction.F32_MIN]);
			}

			return saveByteCode(context, [isFloat64 ? WASMInstruction.F64_MAX : WASMInstruction.F32_MAX]);
		}
	);

export default createMinMax;
