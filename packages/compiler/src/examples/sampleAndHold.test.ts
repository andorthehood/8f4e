import sampleAndHold from './sampleAndHold.asm';

import { createTestModule } from '../testUtils';
import { TestModule } from '../types';

let testModule: TestModule;

describe('sampleAndHold', () => {
	beforeAll(async () => {
		testModule = await createTestModule(sampleAndHold);
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

	test('if the output changes only after trigger', () => {
		const { memory, test } = testModule;

		const inAddress = memory.allocMemoryForPointer('in');
		const triggerAddress = memory.allocMemoryForPointer('in:trigger');

		memory.set(triggerAddress, 0);
		memory.set(inAddress, 8);
		test();
		memory.set(triggerAddress, 1000);
		memory.set(inAddress, 10);
		test();
		memory.set(triggerAddress, 0);
		memory.set(inAddress, 12);
		test();
		expect(memory.get('out')).toBe(10);
	});
});
