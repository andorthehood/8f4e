import { createTestModule } from '../../testUtils';
import constant, { Memory } from '../../modules/constant';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(constant('id', () => 0)).toMatchSnapshot();
});

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(constant, { out: 0 });
	});

	beforeEach(() => {
		testModule.reset();
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
