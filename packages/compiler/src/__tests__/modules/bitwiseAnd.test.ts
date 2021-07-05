import { createTestModule } from '../../testUtils';
import bitwiseAnd, { Memory } from '../../modules/bitwiseAnd';
import { I16_SIGNED_LARGEST_NUMBER } from '../../consts';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(bitwiseAnd('id', () => 0)).toMatchSnapshot();
});

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(bitwiseAnd);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('bitwise and module', () => {
		const { memory, test } = testModule;

		memory[Memory.INPUT_1_POINTER] = 10 * memory.BYTES_PER_ELEMENT;
		memory[Memory.INPUT_2_POINTER] = 11 * memory.BYTES_PER_ELEMENT;

		memory[10] = 10;
		memory[11] = 10;
		test();
		expect(memory[Memory.OUTPUT]).toBe(10 & 10);

		memory[10] = 69;
		memory[11] = 420;
		test();
		expect(memory[Memory.OUTPUT]).toBe(69 & 420);

		memory[10] = -69;
		memory[11] = 420;
		test();
		expect(memory[Memory.OUTPUT]).toBe(-69 & 420);

		memory[10] = I16_SIGNED_LARGEST_NUMBER;
		memory[11] = I16_SIGNED_LARGEST_NUMBER;
		test();
		expect(memory[Memory.OUTPUT]).toBe(I16_SIGNED_LARGEST_NUMBER & I16_SIGNED_LARGEST_NUMBER);
	});
});
