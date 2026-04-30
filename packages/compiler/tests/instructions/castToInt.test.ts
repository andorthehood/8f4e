import { describe, expect, test } from 'vitest';

import { createTestModule, moduleTester } from './testUtils';

moduleTester(
	'castToInt',
	`module castToInt

float input
int output

push &output
push input
castToInt
store

moduleEnd
`,
	[
		[{ input: 1.1 }, { output: 1 }],
		[{ input: -69.69 }, { output: -69 }],
		[{ input: 0.001 }, { output: 0 }],
		[{ input: 420.99 }, { output: 420 }],
	]
);

describe('castToInt saturation', () => {
	test('does not trap when a float32 is outside the signed i32 range', async () => {
		const testModule = await createTestModule(`module castToIntSaturation

float input
int output

push &output
push input
castToInt
store

moduleEnd
`);
		const view = new DataView(testModule.memory.buffer);
		view.setFloat32(testModule.memoryMap.input.byteAddress, 2147483648, true);

		expect(() => testModule.test()).not.toThrow();
		expect(view.getInt32(testModule.memoryMap.output.byteAddress, true)).toBe(2147483647);
	});

	test('converts float32 NaN to zero', async () => {
		const testModule = await createTestModule(`module castToIntNaN

float input
int output

push &output
push input
castToInt
store

moduleEnd
`);
		const view = new DataView(testModule.memory.buffer);
		view.setFloat32(testModule.memoryMap.input.byteAddress, NaN, true);

		testModule.test();
		expect(view.getInt32(testModule.memoryMap.output.byteAddress, true)).toBe(0);
	});
});
