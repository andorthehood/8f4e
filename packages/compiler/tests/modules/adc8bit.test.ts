import { createTestModule } from '../utils';
import adc8bit, { Memory } from '../../src/modules/adc8bit';

let testModule;

beforeAll(async () => {
	testModule = await createTestModule(adc8bit);
});

beforeEach(() => {
	testModule.reset();
});

test('adc8bit module', () => {
	const { memory, test } = testModule;

	memory[Memory.DEFAULT_VALUE] = 3000;
	test();
	expect(memory[Memory.OUTPUT_1]).toBe(0);

	memory[Memory.DEFAULT_VALUE] = 2000;
	test();
	expect(memory[Memory.OUTPUT_1]).toBe(0);

	memory[Memory.DEFAULT_VALUE] = 3000;
	test();
	expect(memory[Memory.OUTPUT_1]).toBe(0);
});
