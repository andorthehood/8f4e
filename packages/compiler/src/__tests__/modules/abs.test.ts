import { createTestModule } from '../../testUtils';
import abs, { Memory } from '../../modules/abs';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(abs('id', { byte: nthWord => nthWord * 4, word: nthWord => nthWord })).toMatchSnapshot();
});

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(abs);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('abs module', () => {
		const { memory, test } = testModule;

		memory[Memory.DEFAULT_VALUE] = 1;
		test();
		expect(memory[Memory.OUTPUT]).toBe(1);

		memory[Memory.DEFAULT_VALUE] = -1;
		test();
		expect(memory[Memory.OUTPUT]).toBe(1);

		memory[Memory.DEFAULT_VALUE] = -69;
		test();
		expect(memory[Memory.OUTPUT]).toBe(69);

		memory[Memory.DEFAULT_VALUE] = 420;
		test();
		expect(memory[Memory.OUTPUT]).toBe(420);
	});
});
