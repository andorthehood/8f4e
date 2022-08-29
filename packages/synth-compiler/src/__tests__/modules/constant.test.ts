import { createTestModule } from '../../testUtils';
import constant, { Memory } from '../../modules/constant';

let testModule;

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(constant, { out: 0 });
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

	test('constant module', () => {
		const { memory, test } = testModule;

		memory[Memory.OUTPUT] = 1;
		test();
		expect(memory[Memory.OUTPUT]).toBe(1);

		memory[Memory.OUTPUT] = -69;
		test();
		expect(memory[Memory.OUTPUT]).toBe(-69);
	});
});
