import { createTestModule, TestModule } from '@8f4e/compiler';

import mixer from '../../examples/mixer.asm';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../../examples/consts';

let testModule: TestModule;

const fixtures: [inputs: [number, number, number, number], output: number][] = [
	[[1, 1, 1, 1], 4],
	[[1, -1, 1, -1], 0],
	[
		[I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_LARGEST_NUMBER],
		I16_SIGNED_LARGEST_NUMBER,
	],
	[
		[I16_SIGNED_SMALLEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER],
		I16_SIGNED_SMALLEST_NUMBER,
	],
];

describe('mixer', () => {
	beforeAll(async () => {
		testModule = await createTestModule(mixer);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the wat code matches with the snapshot', () => {
		expect(testModule.wat).toMatchSnapshot();
	});

	test('if the generated memory map matches with the snapshot', () => {
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test.each(fixtures)('given inputs %p the expected output is %p', (inputs, output) => {
		const { memory, test } = testModule;

		const in1 = memory.allocMemoryForPointer('in:1');
		const in2 = memory.allocMemoryForPointer('in:2');
		const in3 = memory.allocMemoryForPointer('in:3');
		const in4 = memory.allocMemoryForPointer('in:4');
		memory.set(in1, inputs[0]);
		memory.set(in2, inputs[1]);
		memory.set(in3, inputs[2]);
		memory.set(in4, inputs[3]);

		test();
		expect(memory.get('out')).toBe(output);
	});
});
