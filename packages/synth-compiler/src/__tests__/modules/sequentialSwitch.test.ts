import { createTestModule } from '../../testUtils';
import splitter from '../../modules/sequentialSwitch.asm';

let testModule;

const fixtures = [
	[1, 2, 3, 4, 0, 1],
	[1, 2, 3, 4, 1, 2],
	[1, 2, 3, 4, 2, 3],
	[1, 2, 3, 4, 3, 4],
	[1, 2, 3, 4, 0, 1],
	[1, 2, 3, 4, 1, 2],
	[1, 2, 3, 4, 2, 3],
	[1, 2, 3, 4, 3, 4],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(splitter);
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

	test.each(fixtures)(
		'given %p %p %p %p as inputs, %p pulse(s), the output should be %p',
		(input1, input2, input3, input4, numberOfPulses, output) => {
			const { memory, test } = testModule;

			memory[2] = 19 * memory.BYTES_PER_ELEMENT;
			memory[5] = 20 * memory.BYTES_PER_ELEMENT;
			memory[6] = 21 * memory.BYTES_PER_ELEMENT;
			memory[7] = 22 * memory.BYTES_PER_ELEMENT;
			memory[8] = 23 * memory.BYTES_PER_ELEMENT;
			memory[20] = input1;
			memory[21] = input2;
			memory[22] = input3;
			memory[23] = input4;

			test();

			for (let i = 0; i < numberOfPulses; i++) {
				memory[19] = 0;
				test();
				memory[19] = 1;
				test();
				memory[19] = 0;
				test();
			}

			expect(memory[1]).toBe(output);
		}
	);
});
