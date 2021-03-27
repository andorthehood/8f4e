import { createTestModule } from '../utils';
import quantizer, { Memory } from '../../src/modules/quantizer2';

let testModule;

beforeAll(async () => {
	testModule = await createTestModule(quantizer);
});

beforeEach(() => {
	testModule.reset();
});

test('quantizer module', () => {
	const { memory, test } = testModule;

	memory[Memory.INPUT_POINTER] = 100 * memory.BYTES_PER_ELEMENT;

	memory[Memory.NUMBER_OF_NOTES] = 1;
	memory[Memory.FIRST_NOTE] = 900;

	memory[100] = 1000;
	test();
	expect(memory[Memory.OUTPUT]).toBe(900);

	memory[100] = 800;
	test();
	expect(memory[Memory.OUTPUT]).toBe(900);

	memory[100] = 400;
	test();
	expect(memory[Memory.OUTPUT]).toBe(900);
});

test('quantizer module', () => {
	const { memory, test } = testModule;

	memory[Memory.INPUT_POINTER] = 100 * memory.BYTES_PER_ELEMENT;

	memory[Memory.NUMBER_OF_NOTES] = 2;
	memory[Memory.FIRST_NOTE] = 1000;
	memory[Memory.FIRST_NOTE + 1] = 500;

	memory[100] = 900;
	test();
	expect(memory[Memory.OUTPUT]).toBe(1000);

	memory[100] = 800;
	test();
	expect(memory[Memory.OUTPUT]).toBe(1000);

	memory[100] = 400;
	test();
	expect(memory[Memory.OUTPUT]).toBe(500);
});
