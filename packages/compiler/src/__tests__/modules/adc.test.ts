import { createTestModule } from '../../testUtils';
import adc, { Memory } from '../../modules/adc';
import { LOGIC_HIGH } from '../../consts';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(adc('id', () => 0)).toMatchSnapshot();
});

describe('functional tests', () => {
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
});
