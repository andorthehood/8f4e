import { describe, test, expect } from 'vitest';

import { moduleTester, createTestModule } from './testUtils';

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
