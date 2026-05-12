import { saveByteCode } from './saveByteCode';

import { areAllOperandsFloat64, areAllOperandsIntegers } from '../../utils/operandTypes';

import type { InstructionCompiler, StackItem } from '@8f4e/compiler-spec';

type NumericBinaryOpcodes = {
	int32: number;
	float32: number;
	float64: number;
};

type NumericBinaryOperands = {
	left: StackItem;
	right: StackItem;
	isInteger: boolean;
	isFloat64: boolean;
	line: Parameters<InstructionCompiler>[0];
	context: Parameters<InstructionCompiler>[1];
};

type NumericBinaryCompilerOptions = {
	opcodes: NumericBinaryOpcodes;
	result: 'numeric' | 'comparison';
	deriveIntegerMetadata?: (left: StackItem, right: StackItem) => Partial<StackItem>;
	validate?: (operands: NumericBinaryOperands) => void;
};

/**
 * Creates instruction compilers for two-operand numeric operations that share the same stack and type flow:
 * pop the right and left operands, select the integer/float32/float64 opcode, update the logical stack,
 * and append the selected bytecode.
 *
 * `deriveIntegerMetadata` lets integer arithmetic preserve known-value/address metadata, while `validate`
 * handles operation-specific semantic checks such as division-by-zero before the result is pushed.
 */
export default function createNumericBinaryCompiler({
	opcodes,
	result,
	deriveIntegerMetadata,
	validate,
}: NumericBinaryCompilerOptions): InstructionCompiler {
	return (line, context) => {
		// Non-null assertions are safe: instruction validation ensures 2 operands exist.
		const right = context.stack.pop()!;
		const left = context.stack.pop()!;
		const isInteger = areAllOperandsIntegers(left, right);
		const isFloat64 = areAllOperandsFloat64(left, right);

		validate?.({ left, right, isInteger, isFloat64, line, context });

		if (result === 'comparison') {
			context.stack.push({ isInteger: true, isNonZero: false });
		} else {
			const integerMetadata: Partial<StackItem> = isInteger ? (deriveIntegerMetadata?.(left, right) ?? {}) : {};
			context.stack.push({
				isInteger,
				...(isFloat64 ? { isFloat64: true } : {}),
				isNonZero: integerMetadata.knownIntegerValue !== undefined ? integerMetadata.knownIntegerValue !== 0 : false,
				...integerMetadata,
			});
		}

		return saveByteCode(context, [isInteger ? opcodes.int32 : isFloat64 ? opcodes.float64 : opcodes.float32]);
	};
}
