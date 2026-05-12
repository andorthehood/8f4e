import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../utils/compilation';
import { areAllOperandsFloat64, areAllOperandsIntegers } from '../utils/operandTypes';
import { deriveSubStackMetadata } from '../utils/stackAddressMetadata';

import type { InstructionCompiler, StackItem } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `sub`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const sub: InstructionCompiler = (line, context) => {
	// Non-null assertion is safe: instruction validation ensures 2 operands exist
	const operand2 = context.stack.pop()!;
	const operand1 = context.stack.pop()!;

	const isInteger = areAllOperandsIntegers(operand1, operand2);
	const isFloat64 = areAllOperandsFloat64(operand1, operand2);
	const integerMetadata: Partial<StackItem> = isInteger ? deriveSubStackMetadata(operand1, operand2) : {};

	context.stack.push({
		isInteger,
		...(isFloat64 ? { isFloat64: true } : {}),
		isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
		...integerMetadata,
	});
	return saveByteCode(context, [
		isInteger ? WASMInstruction.I32_SUB : isFloat64 ? WASMInstruction.F64_SUB : WASMInstruction.F32_SUB,
	]);
};

export default sub;
