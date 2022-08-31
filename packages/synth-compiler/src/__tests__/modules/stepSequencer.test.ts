import { createTestModule } from '../../testUtils';
import splitter from '../../modules/splitter.asm';

let testModule;

const fixtures = [
	[1, 1],
	[69, 69],
	[420, 420],
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

	test.each(fixtures)('given %p as input, all the outputs should be %p', (input, output) => {
		const { memory, test } = testModule;

		memory[1] = 20 * memory.BYTES_PER_ELEMENT;

		memory[20] = 0;
		test();
		memory[20] = 1;
		test();
		expect(memory[2]).toBe(output);
	});
});
