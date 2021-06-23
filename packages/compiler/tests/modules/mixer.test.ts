import { createTestModule } from '../utils';
import mixer, { Memory } from '../../src/modules/mixer';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../../src/consts';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(mixer('id', () => 0)).toMatchSnapshot();
});

describe('funciontal tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(mixer);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('negate module', () => {
		const { memory, test } = testModule;

		memory[Memory.INPUT_POINTER_1] = 10 * memory.BYTES_PER_ELEMENT;
		memory[Memory.INPUT_POINTER_2] = 11 * memory.BYTES_PER_ELEMENT;
		memory[Memory.INPUT_POINTER_3] = 12 * memory.BYTES_PER_ELEMENT;
		memory[Memory.INPUT_POINTER_4] = 13 * memory.BYTES_PER_ELEMENT;

		memory[10] = 1;
		memory[11] = 1;
		memory[12] = 1;
		memory[13] = 1;
		test();
		expect(memory[Memory.OUTPUT]).toBe(4);

		memory[10] = 1;
		memory[11] = -1;
		memory[12] = 1;
		memory[13] = -1;
		test();
		expect(memory[Memory.OUTPUT]).toBe(0);

		memory[10] = I16_SIGNED_LARGEST_NUMBER;
		memory[11] = I16_SIGNED_LARGEST_NUMBER;
		memory[12] = I16_SIGNED_LARGEST_NUMBER;
		memory[13] = I16_SIGNED_LARGEST_NUMBER;
		test();
		expect(memory[Memory.OUTPUT]).toBe(I16_SIGNED_LARGEST_NUMBER);

		memory[10] = I16_SIGNED_SMALLEST_NUMBER;
		memory[11] = I16_SIGNED_SMALLEST_NUMBER;
		memory[12] = I16_SIGNED_SMALLEST_NUMBER;
		memory[13] = I16_SIGNED_SMALLEST_NUMBER;
		test();
		expect(memory[Memory.OUTPUT]).toBe(I16_SIGNED_SMALLEST_NUMBER);
	});
});
