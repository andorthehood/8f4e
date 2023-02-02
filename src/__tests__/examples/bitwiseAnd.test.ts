import { createTestModule, TestModule } from '@8f4e/compiler';

import bitwiseAnd from '../../examples/bitwiseAnd.asm';
import { I16_SIGNED_LARGEST_NUMBER } from '../../examples/consts';

let testModule: TestModule;

const fixtures: [input1: number, input2: number, output: number][] = [
	[10, 10, 10 & 10],
	[69, 420, 69 & 420],
	[-69, 420, -69 & 420],
	[I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_LARGEST_NUMBER & I16_SIGNED_LARGEST_NUMBER],
];

describe('bitwiseAnd', () => {
	beforeAll(async () => {
		testModule = await createTestModule(bitwiseAnd);
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

	test.each(fixtures)('given %p and %p, the output is %p', (input1, input2, output) => {
		const { memory, test } = testModule;

		const in1Address = memory.allocMemoryForPointer('in:1');
		const in2Address = memory.allocMemoryForPointer('in:2');
		memory.set(in1Address, input1);
		memory.set(in2Address, input2);
		test();
		expect(memory.get('out')).toBe(output);
	});
});
