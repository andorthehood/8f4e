import { createTestModule } from '../../testUtils';
import random, { Memory } from '../../modules/random';

let testModule;

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(random);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the wat code matches with the snapshot', () => {
		expect(testModule.wat).toMatchSnapshot();
	});

	test('if the generated memory map matches with the snapshot', () => {
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test('random module', () => {
		const { memory, test } = testModule;

		memory[Memory.OUTPUT] = 69420;

		test();
		expect(memory[Memory.OUTPUT]).toBe(-30826);

		test();
		expect(memory[Memory.OUTPUT]).toBe(-15413);

		test();
		expect(memory[Memory.OUTPUT]).toBe(25062);

		test();
		expect(memory[Memory.OUTPUT]).toBe(12531);

		test();
		expect(memory[Memory.OUTPUT]).toBe(6265);

		test();
		expect(memory[Memory.OUTPUT]).toBe(-29637);
	});
});
