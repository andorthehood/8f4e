import { createTestModule } from '@8f4e/synth-compiler';

import invert from '../../../modules/engines/invert.asm';

let testModule;

const fixtures = [
	[1, -1],
	[69, -69],
	[0, 0],
	[-420, 420],
];

describe('invert module', () => {
	beforeAll(async () => {
		testModule = await createTestModule(invert);
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

	test.each(fixtures)('given %p as input, the output is %p', (input, output) => {
		const { memory, test } = testModule;

		memory[0] = input;
		test();
		expect(memory[2]).toBe(output);
	});
});
