import { createTestModule } from '@8f4e/synth-compiler';

import min from '../../../modules/engines/min.asm';

let testModule;

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(min);
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

	test('min module', () => {
		const { memory, test } = testModule;

		memory[1] = 10 * memory.BYTES_PER_ELEMENT;
		memory[2] = 11 * memory.BYTES_PER_ELEMENT;

		memory[10] = 10;
		memory[11] = 10;
		test();
		expect(memory[3]).toBe(10);

		memory[10] = 0;
		memory[11] = 10;
		test();
		expect(memory[3]).toBe(0);

		memory[10] = 10;
		memory[11] = 0;
		test();
		expect(memory[3]).toBe(0);

		memory[10] = 0;
		memory[11] = 0;
		test();
		expect(memory[3]).toBe(0);

		memory[10] = -10;
		memory[11] = 0;
		test();
		expect(memory[3]).toBe(-10);

		memory[10] = -10;
		memory[11] = -100;
		test();
		expect(memory[3]).toBe(-100);
	});
});
