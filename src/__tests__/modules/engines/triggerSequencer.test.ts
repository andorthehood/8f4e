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
		const { test, memorySet, memoryGet } = testModule;
		memorySet('steps', 69420);
		test();
		expect(memoryGet('out')).toBe(69420);
	});

	test("if the pointer doesn't move when there is no trigger pulse", () => {
		const { memoryGet, test } = testModule;

		for (let i = 0; i < 10; i++) {
			expect(memoryGet('stepPointer')).toBe(0);
			test();
		}
	});

	test('if the pointer moves when a trigger pulse is provided', () => {
		const { test, memorySet, memoryGet, allocMemoryForPointer } = testModule;

		const trigger = allocMemoryForPointer('trigger');

		for (let i = 1; i < 10; i++) {
			memorySet(trigger, 1);
			test();
			expect(memoryGet('stepPointer')).toBe(i * WORD_LENGTH);
			memorySet(trigger, 0);
			test();
			expect(memoryGet('stepPointer')).toBe(i * WORD_LENGTH);
		}
	});

	test('if the pointer moves when a trigger pulse is provided', () => {
		const { test, memoryGet, memorySet, allocMemoryForPointer } = testModule;

		const trigger = allocMemoryForPointer('trigger');
		memorySet('steps', 69, 0);
		memorySet('steps', 70, 1);
		memorySet('steps', 71, 2);
		memorySet('steps', 72, 3);

		for (let i = 69; i < 73; i++) {
			test();
			expect(memoryGet('out')).toBe(i);
			memorySet(trigger, 1);
			test();
			memorySet(trigger, 0);
		}
	});
});
