import { createTestModule } from '../utils';
import invert, { Memory } from '../../src/modules/invert';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(invert('id', () => 0)).toMatchSnapshot();
});

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(invert);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('invert module', () => {
		const { memory, test } = testModule;

		memory[Memory.DEFAULT_VALUE] = 1;
		test();
		expect(memory[Memory.OUTPUT]).toBe(-1);

		memory[Memory.DEFAULT_VALUE] = -69;
		test();
		expect(memory[Memory.OUTPUT]).toBe(69);

		memory[Memory.DEFAULT_VALUE] = 0;
		test();
		expect(memory[Memory.OUTPUT]).toBe(0);
	});
});
