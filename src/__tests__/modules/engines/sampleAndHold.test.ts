import { createTestModule } from '@8f4e/synth-compiler';

import sampleAndHold from '../../../modules/engines/sampleAndHold.asm';

let testModule;

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(sampleAndHold);
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

		memory[2] = 10 * memory.BYTES_PER_ELEMENT;
		memory[1] = 11 * memory.BYTES_PER_ELEMENT;

		memory[10] = 0;
		memory[11] = 8;
		test();
		memory[10] = 1000;
		memory[11] = 10;
		test();
		memory[10] = 0;
		memory[11] = 12;
		test();
		expect(memory[4]).toBe(10);

		memory[10] = 0;
		memory[11] = 8;
		test();
		memory[10] = 1000;
		memory[11] = 10;
		test();
		memory[10] = 100;
		memory[11] = 12;
		test();
		memory[10] = 2000;
		memory[11] = 14;
		test();
		memory[10] = 0;
		memory[11] = 16;
		test();
		expect(memory[4]).toBe(14);
	});
});
