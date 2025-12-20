import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers, saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const div: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'matching',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand1 = context.stack.pop()!;
		const operand2 = context.stack.pop()!;

		if (!operand1.isNonZero) {
			throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
		}

		const isInteger = areAllOperandsIntegers(operand1, operand2);
		context.stack.push({ isInteger, isNonZero: true });
		return saveByteCode(context, [isInteger ? WASMInstruction.I32_DIV_S : WASMInstruction.F32_DIV]);
	}
);

export default div;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'div (int)',
	`module div

int input1
int input2 
int output
    
push &output
push input1
push input2
ensureNonZero
div
store
    
moduleEnd
`,
	[[{ input1: 100, input2: 10 }, { output: 10 }]]
);

moduleTester(
	'div (float)',
	`module div

float input1
float input2 
float output
    
push &output
push input1
push input2
ensureNonZero
div
store
    
moduleEnd
`,
	[[{ input1: 420.001, input2: 69.001 }, { output: 6.0869 }]]
);
}
