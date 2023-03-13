import floatCounter from './floatCounter.asm';

import { createTestModule } from '../testUtils';
import { TestModule } from '../types';

let testModule: TestModule;

describe('floatCounter', () => {
	beforeAll(async () => {
		testModule = await createTestModule(floatCounter);
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

	test('given input %p the output should be the same', () => {
		const { memory, test } = testModule;

		test();
		expect(memory.get('out')).toBeCloseTo(0.2, 5);
		test();
		expect(memory.get('out')).toBeCloseTo(0.3, 5);
	});
});
