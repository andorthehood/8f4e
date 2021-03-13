import { createTestModule } from '../utils';
import min, { Memory } from '../../src/modules/min';

let testModule;

beforeAll(async () => {
	testModule = await createTestModule(min);
});

beforeEach(() => {
	testModule.reset();
});

test('min module', () => {
	const { memory, test } = testModule;

	memory[Memory.INPUT_1_POINTER] = 10 * memory.BYTES_PER_ELEMENT;
	memory[Memory.INPUT_2_POINTER] = 11 * memory.BYTES_PER_ELEMENT;

	memory[10] = 10;
	memory[11] = 10;
	test();
	expect(memory[Memory.OUTPUT]).toBe(10);

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
	expect(memory[Memory.OUTPUT]).toBe(-10);

	memory[10] = -10;
	memory[11] = -100;
	test();
	expect(memory[Memory.OUTPUT]).toBe(-100);
});
