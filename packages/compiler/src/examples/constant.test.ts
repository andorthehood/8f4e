import constant from './constant.asm';

import { createTestModule } from '../testUtils';
import { TestModule } from '../types';

let testModule: TestModule;

const fixtures = [1, -69];

describe('constant', () => {
	beforeAll(async () => {
		testModule = await createTestModule(constant);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the generated ast matches with the snapshot', () => {
		expect(testModule.ast).toMatchSnapshot();
	});

	test('if the wat code matches with the snapshot', () => {
		expect(testModule.wat).toMatchSnapshot();
	});

	test('if the generated memory map matches with the snapshot', () => {
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test.each(fixtures)('given input %p the output should be the same', input => {
		const { memory, test } = testModule;

		memory.set('out', input);
		test();
		expect(memory.get('out')).toBe(input);
	});
});
