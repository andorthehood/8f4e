import { createTestModule, TestModule } from '@8f4e/compiler';

import random from './random.asm';

let testModule: TestModule;

const fixtures = [-30826, -15413, 25062, 12531, 6265, -29637];

describe('random', () => {
	beforeAll(async () => {
		testModule = await createTestModule(random());
		const { memory } = testModule;
		memory.set('seed', 69420);
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
		expect(memory.get('out')).toBe(output);
	});
});
