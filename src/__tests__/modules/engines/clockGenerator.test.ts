import { createTestModule } from '@8f4e/compiler';

import clockGenerator from '../../../modules/engines/clockGenerator.asm';

let testModule;

describe('clockGenerator module', () => {
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
		memory[1] = 10;

		for (let i = 0; i < 30; i++) {
			expect(memory[0]).toBe(i % 11);
			test();
		}
	});
});
