import { createTestModule } from '../../testUtils';
import and, { Memory } from '../../modules/logicAnd';

import { I16_SIGNED_LARGEST_NUMBER } from '../../consts';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(and('id', { byte: () => 0, word: () => 0 })).toMatchSnapshot();
});

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(and);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('and module', () => {
		const { memory, test } = testModule;

		memory[Memory.INPUT_1_POINTER] = 10 * memory.BYTES_PER_ELEMENT;
		memory[Memory.INPUT_2_POINTER] = 11 * memory.BYTES_PER_ELEMENT;

		memory[10] = 10;
		memory[11] = 10;
		test();
		expect(memory[Memory.OUTPUT]).toBe(I16_SIGNED_LARGEST_NUMBER);

		memory[10] = 0;
		memory[11] = 10;
		test();
		expect(memory[Memory.OUTPUT]).toBe(0);

		memory[10] = 10;
		memory[11] = 0;
		test();
		expect(memory[Memory.OUTPUT]).toBe(0);

		memory[10] = 0;
		memory[11] = 0;
		test();
		expect(memory[Memory.OUTPUT]).toBe(0);

		memory[10] = -10;
		memory[11] = 0;
		test();
		expect(memory[Memory.OUTPUT]).toBe(0);
	});
});
