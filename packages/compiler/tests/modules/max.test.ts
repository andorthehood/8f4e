import { createTestModule } from '../utils';
import max, { Memory } from '../../src/modules/max';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(max('id', () => 0)).toMatchSnapshot();
});

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(max);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('max module', () => {
		const { memory, test } = testModule;

		memory[10] = 10;
		memory[11] = 10;
		memory[Memory.INPUT_1_POINTER] = 10 * memory.BYTES_PER_ELEMENT;
		memory[Memory.INPUT_2_POINTER] = 11 * memory.BYTES_PER_ELEMENT;
		test();
		expect(memory[Memory.OUTPUT]).toBe(10);

		memory[10] = 0;
		memory[11] = 10;
		memory[Memory.INPUT_1_POINTER] = 10 * memory.BYTES_PER_ELEMENT;
		memory[Memory.INPUT_2_POINTER] = 11 * memory.BYTES_PER_ELEMENT;
		test();
		expect(memory[Memory.OUTPUT]).toBe(10);

		memory[10] = 10;
		memory[11] = 0;
		memory[Memory.INPUT_1_POINTER] = 10 * memory.BYTES_PER_ELEMENT;
		memory[Memory.INPUT_2_POINTER] = 11 * memory.BYTES_PER_ELEMENT;
		test();
		expect(memory[Memory.OUTPUT]).toBe(10);

		memory[10] = 0;
		memory[11] = 0;
		memory[Memory.INPUT_1_POINTER] = 10 * memory.BYTES_PER_ELEMENT;
		memory[Memory.INPUT_2_POINTER] = 11 * memory.BYTES_PER_ELEMENT;
		test();
		expect(memory[Memory.OUTPUT]).toBe(0);

		memory[10] = -10;
		memory[11] = 0;
		memory[Memory.INPUT_1_POINTER] = 10 * memory.BYTES_PER_ELEMENT;
		memory[Memory.INPUT_2_POINTER] = 11 * memory.BYTES_PER_ELEMENT;
		test();
		expect(memory[Memory.OUTPUT]).toBe(0);

		memory[10] = -10;
		memory[11] = -100;
		memory[Memory.INPUT_1_POINTER] = 10 * memory.BYTES_PER_ELEMENT;
		memory[Memory.INPUT_2_POINTER] = 11 * memory.BYTES_PER_ELEMENT;
		test();
		expect(memory[Memory.OUTPUT]).toBe(-10);
	});
});
