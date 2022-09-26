import { createTestModule } from '@8f4e/compiler';

import bitwiseOr from '../../../modules/engines/bitwiseOr.asm';
import { I16_SIGNED_LARGEST_NUMBER } from '../../../modules/engines/consts';

let testModule;

const fixtures: [input1: number, input2: number, output: number][] = [
	[10, 10, 10 | 10],
	[69, 420, 69 | 420],
	[-69, 420, -69 | 420],
	[I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_LARGEST_NUMBER | I16_SIGNED_LARGEST_NUMBER],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(bitwiseOr);
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
		memory[0] = input1;
		memory[1] = input2;
		test();
		expect(memory[4]).toBe(output);
	});
});
