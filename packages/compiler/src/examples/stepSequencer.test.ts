import triggerSequencer from './stepSequencer.asm';

import { WORD_LENGTH } from '../consts';
import { createTestModule } from '../testUtils';
import { TestModule } from '../types';

let testModule: TestModule;

describe('stepSequencer', () => {
	beforeAll(async () => {
		testModule = await createTestModule(triggerSequencer());
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
		memory.set('stepLength', 15);

		for (let i = 0; i < 15 * WORD_LENGTH; i += WORD_LENGTH) {
			expect(memory.get('stepPointer')).toBe(memory.byteAddress('steps') + i);
			memory.set(trigger, 1);
			test();
			memory.set(trigger, 0);
			test();
		}
	});

	test('if the pointer resets before it would overflow', () => {
		const { test, memory } = testModule;

		const trigger = memory.allocMemoryForPointer('trigger');
		memory.set('stepLength', 3);

		for (let i = 0; i < 10; i += 1) {
			for (let j = 0; j < 3; j++) {
				expect(memory.get('stepPointer')).toBe(memory.byteAddress('steps') + WORD_LENGTH * j);
				memory.set(trigger, 1);
				test();
				memory.set(trigger, 0);
				test();
			}
		}
	});

	test('if the output changes when a trigger pulse is provided', () => {
		const { test, memory } = testModule;

		const trigger = memory.allocMemoryForPointer('trigger');
		memory.set('stepLength', 4);
		memory.set('steps', [69, 70, 71, 72]);

		for (let i = 69; i < 73; i++) {
			test();
			expect(memory.get('out')).toBe(i);
			memory.set(trigger, 1);
			test();
			memory.set(trigger, 0);
		}
	});
});
