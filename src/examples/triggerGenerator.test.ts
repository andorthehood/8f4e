import { createTestModule, I16_SIGNED_LARGEST_NUMBER, TestModule } from '@8f4e/compiler';

import triggerGenerator from './triggerGenerator.asm';

let testModule: TestModule;

describe('triggerGenerator module', () => {
	beforeAll(async () => {
		testModule = await createTestModule(triggerGenerator);
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

	test('if the counter is counting', () => {
		const { memory, test } = testModule;

		memory.set('rate', 10);

		for (let i = 0; i < 30; i++) {
			expect(memory.get('counter')).toBe(i % 11);
			test();
		}
	});

	test('if the pulse is coming', () => {
		const { memory, test } = testModule;

		memory.set('rate', 1);

		for (let i = 0; i < 10; i++) {
			test();
			expect(memory.get('out')).toBe(0);
			test();
			expect(memory.get('out')).toBe(I16_SIGNED_LARGEST_NUMBER);
		}
	});

	test('if the pulse is coming', () => {
		const { memory, test } = testModule;

		memory.set('rate', 10);

		for (let i = 0; i < 10; i++) {
			for (let j = 0; j < 10; j++) {
				test();
				expect(memory.get('out')).toBe(0);
			}
			test();
			expect(memory.get('out')).toBe(I16_SIGNED_LARGEST_NUMBER);
		}
	});

	test('reset input', () => {
		const { memory, test } = testModule;
		memory.set('rate', 10);

		for (let j = 0; j < 10; j++) {
			test();
			expect(memory.get('out')).toBe(0);
		}

		memory.set('reset', 1); // Send reset signal
		test();

		for (let j = 0; j < 10; j++) {
			test();
			expect(memory.get('out')).toBe(0);
		}
	});
});
