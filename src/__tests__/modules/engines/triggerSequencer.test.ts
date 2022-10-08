import { createTestModule, TestModule } from '@8f4e/compiler';
import { WORD_LENGTH } from '@8f4e/compiler/dist/consts';

import triggerSequencer from '../../../modules/engines/triggerSequencer.asm';

let testModule: TestModule;

describe('triggerSequencer', () => {
	beforeAll(async () => {
		testModule = await createTestModule(triggerSequencer());
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

	test("if the pointer doesn't move when there is no trigger pulse", () => {
		const { memory, test } = testModule;

		for (let i = 0; i < 10; i++) {
			expect(memory[0]).toBe(0);
			test();
		}
	});

	test('if the pointer moves when a trigger pulse is provided', () => {
		const { memory, test } = testModule;

		memory[2] = 30 * WORD_LENGTH;

		for (let i = 1; i < 10; i++) {
			memory[30] = 1;
			test();
			expect(memory[0]).toBe(i * WORD_LENGTH);
			memory[30] = 0;
			test();
			expect(memory[0]).toBe(i * WORD_LENGTH);
		}
	});

	test('if the pointer points to the first element of the step array', () => {
		const { memory, test } = testModule;
		memory[4] = 69420;
		test();
		expect(memory[21]).toBe(69420);
	});

	test('if the pointer moves when a trigger pulse is provided', () => {
		const { memory, test, memoryMap } = testModule;

		memory[memoryMap.get('trigger').address] = 30 * WORD_LENGTH;
		memory[memoryMap.get('steps').address] = 69;
		memory[memoryMap.get('steps').address + 1] = 70;
		memory[memoryMap.get('steps').address + 2] = 71;
		memory[memoryMap.get('steps').address + 3] = 72;

		for (let i = 69; i < 73; i++) {
			test();
			expect(memory[memoryMap.get('out').address]).toBe(i);
			memory[30] = 1;
			test();
			memory[30] = 0;
		}
	});
});
