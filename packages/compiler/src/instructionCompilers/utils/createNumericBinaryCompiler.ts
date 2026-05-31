import type { InstructionCompiler, StackItem } from '@8f4e/compiler-spec';

import { areAllOperandsFloat64, areAllOperandsIntegers } from '../../utils/operandTypes';
import { saveByteCode } from './saveByteCode';

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
	validate?: (operands: NumericBinaryOperands) => void;
};

/**
 * Creates instruction compilers for two-operand numeric operations that share opcode selection.
 * Stack effects and validation are owned by stack analysis; codegen only reads the analyzed operands.
 */
export default function createNumericBinaryCompiler({
	opcodes,
	validate,
}: NumericBinaryCompilerOptions): InstructionCompiler {
	return (line, context) => {
		const [left, right] = line.stackAnalysis.consumedOperands;
		const isInteger = areAllOperandsIntegers(left, right);
		const isFloat64 = areAllOperandsFloat64(left, right);

		validate?.({ left, right, isInteger, isFloat64, line, context });

		return saveByteCode(context, [isInteger ? opcodes.int32 : isFloat64 ? opcodes.float64 : opcodes.float32]);
	};
}
