import { createTestModule } from '@8f4e/compiler';

import max from '../../../modules/engines/max.asm';

let testModule;

const fixtures = [
	[10, 10, 10],
	[0, 10, 10],
	[10, 0, 10],
	[0, 0, 0],
	[-10, 0, 0],
	[-10, -100, -10],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(max);
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

	test.each(fixtures)('given %p and %p, the output should be %p', (inputA, inputB, output) => {
		const { memory, test } = testModule;

		memory[10] = inputA;
		memory[11] = inputB;
		memory[1] = 10 * memory.BYTES_PER_ELEMENT;
		memory[2] = 11 * memory.BYTES_PER_ELEMENT;
		test();
		expect(memory[3]).toBe(output);
	});
});
