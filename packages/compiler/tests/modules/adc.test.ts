import { createTestModule } from '../utils';
import adc, { Memory } from '../../src/modules/adc';
import { LOGIC_HIGH } from '../../src/consts';

let testModule;

beforeAll(async () => {
	testModule = await createTestModule(adc, { resolution: 8 });
});

beforeEach(() => {
	testModule.reset();
});

test('adc module', () => {
	const { memory, test } = testModule;

	memory[Memory.DEFAULT_VALUE] = 3000;
	test();
	expect(memory[Memory.OUTPUT_1]).toBe(LOGIC_HIGH);

	memory[Memory.DEFAULT_VALUE] = 2000;
	test();
	expect(memory[Memory.OUTPUT_1]).toBe(LOGIC_HIGH);

	memory[Memory.DEFAULT_VALUE] = 3000;
	test();
	expect(memory[Memory.OUTPUT_1]).toBe(LOGIC_HIGH);
});
