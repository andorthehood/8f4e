import { describe, expect, it } from 'vitest';
import { ErrorCode } from '@8f4e/compiler-spec';

import { createTestModule } from './testUtils';

import compile from '../../src/index';

const comparisonCases = [
	{ instruction: 'equal', left: 1.5, right: 1.5, opcode: 'f64.eq' },
	{ instruction: 'lessThan', left: 1.25, right: 2.5, opcode: 'f64.lt' },
	{ instruction: 'greaterThan', left: 2.5, right: 1.25, opcode: 'f64.gt' },
	{ instruction: 'lessOrEqual', left: 1.25, right: 1.25, opcode: 'f64.le' },
	{ instruction: 'greaterOrEqual', left: 2.5, right: 1.25, opcode: 'f64.ge' },
	{ instruction: 'greaterOrEqualUnsigned', left: 2.5, right: 1.25, opcode: 'f64.ge' },
] as const;

describe('float64 comparison opcodes', () => {
	it.each(comparisonCases)(
		'emits valid Wasm for $instruction with float64 operands',
		async ({ instruction, left, right, opcode }) => {
			const testModule = await createTestModule(`module ${instruction}F64

float64 left
float64 right
int output

push &output
push left
push right
${instruction}
store

moduleEnd
`);

			testModule.memory.set('left', left);
			testModule.memory.set('right', right);
			testModule.test();

			expect(testModule.wat).toContain(opcode);
			expect(testModule.memory.get('output')).toBe(1);
		}
	);

	it.each(comparisonCases)('rejects mixed float widths for $instruction', ({ instruction }) => {
		expect(() => {
			compile(
				{
					entries: {
						main: [
							{
								code: [
									`module ${instruction}MixedFloatWidth`,
									'float left',
									'float64 right',
									'int output',
									'push &output',
									'push left',
									'push right',
									instruction,
									'store',
									'moduleEnd',
								],
							},
						],
					},
				},
				{
					disableSharedMemory: true,
					includeAST: true,
				}
			);
		}).toThrow(`${ErrorCode.MIXED_FLOAT_WIDTH}`);
	});
});

describe('float64 sqrt opcode', () => {
	it('emits valid Wasm for float64 operands', async () => {
		const testModule = await createTestModule(`module sqrtF64

float64 input
float64 output

push &output
push input
sqrt
store

moduleEnd
`);

		testModule.memory.set('input', 2);
		testModule.test();

		expect(testModule.wat).toContain('f64.sqrt');
		expect(testModule.memory.get('output')).toBeCloseTo(Math.sqrt(2));
	});
});
