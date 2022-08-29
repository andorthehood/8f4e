import { createTestModule } from '../../testUtils';
import offset, { Memory } from '../../modules/offset';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../../consts';

let testModule;

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(offset);
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

	test('offset module', () => {
		const { memory, test } = testModule;

		memory[Memory.INPUT_POINTER] = 10 * memory.BYTES_PER_ELEMENT;

		memory[10] = 10;
		memory[Memory.OFFSET] = 10;
		test();
		expect(memory[Memory.OUTPUT]).toBe(20);

		memory[10] = -10;
		memory[Memory.OFFSET] = 10;
		test();
		expect(memory[Memory.OUTPUT]).toBe(0);

		memory[10] = -100;
		memory[Memory.OFFSET] = 10;
		test();
		expect(memory[Memory.OUTPUT]).toBe(-90);

		memory[10] = 1000;
		memory[Memory.OFFSET] = I16_SIGNED_LARGEST_NUMBER;
		test();
		expect(memory[Memory.OUTPUT]).toBe(I16_SIGNED_LARGEST_NUMBER);

		memory[10] = -1000;
		memory[Memory.OFFSET] = I16_SIGNED_SMALLEST_NUMBER;
		test();
		expect(memory[Memory.OUTPUT]).toBe(I16_SIGNED_SMALLEST_NUMBER);
	});
});
