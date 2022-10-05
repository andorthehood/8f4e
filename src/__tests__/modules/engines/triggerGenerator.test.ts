import { createTestModule, I16_SIGNED_LARGEST_NUMBER } from '@8f4e/compiler';

import triggerGenerator from '../../../modules/engines/triggerGenerator.asm';

let testModule;

describe('triggerGenerator module', () => {
	beforeAll(async () => {
		testModule = await createTestModule(triggerGenerator);
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
		memory[1] = 10;

		for (let i = 0; i < 30; i++) {
			expect(memory[0]).toBe(i % 11);
			test();
		}
	});

	test('if the pulse is coming', () => {
		const { memory, test } = testModule;
		memory[1] = 1;

		for (let i = 0; i < 10; i++) {
			test();
			expect(memory[2]).toBe(0);
			test();
			expect(memory[2]).toBe(I16_SIGNED_LARGEST_NUMBER);
		}
	});

	test('if the pulse is coming', () => {
		const { memory, test } = testModule;
		memory[1] = 10;

		for (let i = 0; i < 10; i++) {
			for (let j = 0; j < 10; j++) {
				test();
				expect(memory[2]).toBe(0);
			}
			test();
			expect(memory[2]).toBe(I16_SIGNED_LARGEST_NUMBER);
		}
	});

	test('reset input', () => {
		const { memory, test } = testModule;
		memory[1] = 10;

		for (let j = 0; j < 10; j++) {
			test();
			expect(memory[2]).toBe(0);
		}

		memory[3] = 1; // Send reset signal
		test();

		for (let j = 0; j < 10; j++) {
			test();
			expect(memory[2]).toBe(0);
		}
	});
});
