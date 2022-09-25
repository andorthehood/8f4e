import { createTestModule } from '@8f4e/synth-compiler';

import constant from '../../../modules/engines/constant.asm';

let testModule;

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(constant, { out: 0 });
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

	test('constant module', () => {
		const { memory, test } = testModule;

		memory[0] = 1;
		test();
		expect(memory[0]).toBe(1);

		memory[0] = -69;
		test();
		expect(memory[0]).toBe(-69);
	});
});
