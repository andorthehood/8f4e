import { createTestModule } from '../../testUtils';
import random from '../../modules/random.asm';

let testModule;

const fixtures = [-30826, -15413, 25062, 12531, 6265, -29637];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(random());
		const { memory } = testModule;
		memory[1] = 69420;
	});

	test('if the wat code matches with the snapshot', () => {
		expect(testModule.wat).toMatchSnapshot();
	});

	test('if the generated memory map matches with the snapshot', () => {
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test.each(fixtures)('given the seed 69420, the output should be %p', output => {
		const { memory, test } = testModule;

		test();
		expect(memory[1]).toBe(output);
	});
});
