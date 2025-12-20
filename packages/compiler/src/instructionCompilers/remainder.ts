import { ErrorCode, getError } from '../errors';
import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { InstructionCompiler } from '../types';

const remainder: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand1 = context.stack.pop()!;
		context.stack.pop()!; // Pop second operand (not used since type is already validated)

		if (!operand1.isNonZero) {
			throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
		}

		context.stack.push({ isInteger: true, isNonZero: false });
		return saveByteCode(context, [WASMInstruction.I32_REM_S]);
	}
);

export default remainder;



if (import.meta.vitest) {
	const { describe, test, expect } = await import('vitest');
	const { moduleTester, createTestModule } = await import('./testUtils');

moduleTester(
	'remainder with ensureNonZero',
	`module remainder

int input1
int input2
int output

push &output
push input1
push input2
ensureNonZero
remainder
store

moduleEnd
`,
	[[{ input1: 4, input2: 2 }, { output: 0 }]],
	[[{ input1: 3, input2: 2 }, { output: 1 }]]
);

describe('remainder without ensureNonZero', () => {
	test('should throw DIVISION_BY_ZERO error when divisor may be zero', async () => {
		const moduleCode = `module remainder

int input1
int input2
int output

push &output
push input1
push input2
remainder
store

moduleEnd
`;
		await expect(createTestModule(moduleCode)).rejects.toThrow('Possible division by zero');
	});
});

describe('remainder with non-zero constant', () => {
	test('should compile successfully when divisor is a non-zero constant', async () => {
		const moduleCode = `module remainder

int input1
int output

push &output
push input1
push 2
remainder
store

moduleEnd
`;
		const testModule = await createTestModule(moduleCode);
		expect(testModule.ast).toBeDefined();
	});
});
}
