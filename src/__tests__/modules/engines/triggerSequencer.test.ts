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

	test('if the pointer points to the first element of the step array', () => {
		const { test, memory } = testModule;
		memory.set('steps', 69420);
		test();

		expect(memory.get('out')).toBe(69420);
	});

	test("if the pointer doesn't move when there is no trigger pulse", () => {
		const { memory, test } = testModule;

		for (let i = 0; i < 10; i++) {
			expect(memory.get('stepPointer')).toBe(memory.byteAddress('steps'));
			test();
		}
	});

	test('if the pointer moves when a trigger pulse is provided', () => {
		const { test, memory } = testModule;

		const trigger = memory.allocMemoryForPointer('trigger');

		for (let i = memory.byteAddress('steps'); i < 18 * WORD_LENGTH; i += WORD_LENGTH) {
			expect(memory.get('stepPointer')).toBe(i);
			memory.set(trigger, 1);
			test();
			memory.set(trigger, 0);
			test();
		}
	});

	test('if the pointer moves when a trigger pulse is provided', () => {
		const { test, memory } = testModule;

		const trigger = memory.allocMemoryForPointer('trigger');
		memory.set('steps', 69, 0);
		memory.set('steps', 70, 1);
		memory.set('steps', 71, 2);
		memory.set('steps', 72, 3);

		for (let i = 69; i < 73; i++) {
			test();
			expect(memory.get('out')).toBe(i);
			memory.set(trigger, 1);
			test();
			memory.set(trigger, 0);
		}
	});
});
