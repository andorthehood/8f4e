import { createTestModule, I16_SIGNED_LARGEST_NUMBER, TestModule } from '@8f4e/compiler';

import clockGenerator from '../../examples/square.asm';

let testModule: TestModule;

describe('square generator module', () => {
	beforeAll(async () => {
		testModule = await createTestModule(clockGenerator);
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
			test();
			expect(memory.get('out')).toBe(I16_SIGNED_LARGEST_NUMBER);
			test();
			expect(memory.get('out')).toBe(0);
		}
	});

	test('if the pulse is coming', () => {
		const { memory, test } = testModule;
		memory.set('rate', 0);

		for (let i = 0; i < 10; i++) {
			test();
			expect(memory.get('out')).toBe(I16_SIGNED_LARGEST_NUMBER);
			test();
			expect(memory.get('out')).toBe(0);
		}
	});
});
