import { createTestModule, TestModule } from '@8f4e/compiler';
import { I16_SIGNED_LARGEST_NUMBER, WORD_LENGTH } from '@8f4e/compiler/dist/consts';

import triggerSequencer from './triggerSequencer.asm';

let testModule: TestModule;

describe('triggerSequencer', () => {
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

	test("if the pointer doesn't move when there is no trigger pulse", () => {
		const { memory, test } = testModule;

		for (let i = 0; i < 10; i++) {
			expect(memory.get('stepPointer')).toBe(memory.byteAddress('stepMinusOne'));
			test();
		}
	});

	test('if the pointer moves when a trigger pulse is provided', () => {
		const { test, memory } = testModule;

		const trigger = memory.allocMemoryForPointer('trigger');
		memory.set('stepLength', 15);

		for (let i = 0; i < 15 * WORD_LENGTH; i += WORD_LENGTH) {
			memory.set(trigger, 1);
			test();
			memory.set(trigger, 0);
			test();
			expect(memory.get('stepPointer')).toBe(memory.byteAddress('steps') + i);
		}
	});

	test('if the pointer resets before it would overflow', () => {
		const { test, memory } = testModule;

		const trigger = memory.allocMemoryForPointer('trigger');
		memory.set('stepLength', 3);

		for (let i = 0; i < 10; i += 1) {
			for (let j = 0; j < 3; j++) {
				memory.set(trigger, 1);
				test();
				memory.set(trigger, 0);
				test();
				expect(memory.get('stepPointer')).toBe(memory.byteAddress('steps') + WORD_LENGTH * j);
			}
		}
	});

	test('if the pointer resets when the reset input is high', () => {
		const { test, memory } = testModule;

		const trigger = memory.allocMemoryForPointer('trigger');
		const reset = memory.allocMemoryForPointer('reset');
		memory.set('stepLength', 6);

		for (let i = 0; i < 10; i += 1) {
			for (let j = 0; j < 3; j++) {
				memory.set(trigger, 1);
				test();
				memory.set(trigger, 0);
				test();
				expect(memory.get('stepPointer')).toBe(memory.byteAddress('steps') + WORD_LENGTH * j);
			}

			memory.set(reset, 1);
			test();
			memory.set(reset, 0);
			test();
			expect(memory.get('stepPointer')).toBe(memory.byteAddress('stepMinusOne'));
		}
	});

	test('if the pulse only appears on the output once', () => {
		const { test, memory } = testModule;

		const trigger = memory.allocMemoryForPointer('trigger');
		memory.set('stepLength', 4);
		memory.set('steps', [1, 1, 1, 1]);

		for (let i = 0; i < 10; i++) {
			test();
			expect(memory.get('out')).toBe(0);
		}

		memory.set(trigger, 1);
		test();
		expect(memory.get('out')).toBe(I16_SIGNED_LARGEST_NUMBER);

		for (let i = 0; i < 10; i++) {
			test();
			expect(memory.get('out')).toBe(0);
		}
	});

	test('if the pulse appears once every time the trigger is high', () => {
		const { test, memory } = testModule;

		const trigger = memory.allocMemoryForPointer('trigger');
		memory.set('stepLength', 4);
		memory.set('steps', [1, 1, 1, 1]);

		test();
		expect(memory.get('out')).toBe(0);
		memory.set(trigger, 1);
		test();
		expect(memory.get('out')).toBe(I16_SIGNED_LARGEST_NUMBER);
		memory.set(trigger, 0);
		test();

		for (let i = 0; i < 10; i++) {
			test();
			expect(memory.get('out')).toBe(0);
		}

		memory.set(trigger, 1);
		test();
		expect(memory.get('out')).toBe(I16_SIGNED_LARGEST_NUMBER);

		for (let i = 0; i < 10; i++) {
			test();
			expect(memory.get('out')).toBe(0);
		}
	});
});
