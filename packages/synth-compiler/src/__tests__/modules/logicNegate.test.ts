import { createTestModule } from '../../testUtils';
import negate, { Memory } from '../../modules/logicNegate';
import { I16_SIGNED_LARGEST_NUMBER } from '../../consts';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(negate('id', { byte: () => 0, word: () => 0 })).toMatchSnapshot();
});

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(negate);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('negate module', () => {
		const { memory, test } = testModule;

		memory[Memory.DEFAULT_VALUE] = 1;
		test();
		expect(memory[Memory.OUTPUT]).toBe(0);

		memory[Memory.DEFAULT_VALUE] = -69;
		test();
		expect(memory[Memory.OUTPUT]).toBe(I16_SIGNED_LARGEST_NUMBER);

		memory[Memory.DEFAULT_VALUE] = 0;
		test();
		expect(memory[Memory.OUTPUT]).toBe(I16_SIGNED_LARGEST_NUMBER);
	});
});
