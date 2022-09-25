import { createTestModule } from '@8f4e/synth-compiler';

import offset from '../../../modules/engines/offset.asm';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../../../modules/engines/consts';

let testModule;

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(offset);
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

	test('offset module', () => {
		const { memory, test } = testModule;

		memory[1] = 10 * memory.BYTES_PER_ELEMENT;

		memory[10] = 10;
		memory[2] = 10;
		test();
		expect(memory[3]).toBe(20);

		memory[10] = -10;
		memory[2] = 10;
		test();
		expect(memory[3]).toBe(0);

		memory[10] = -100;
		memory[2] = 10;
		test();
		expect(memory[3]).toBe(-90);

		memory[10] = 1000;
		memory[2] = I16_SIGNED_LARGEST_NUMBER;
		test();
		expect(memory[3]).toBe(I16_SIGNED_LARGEST_NUMBER);

		memory[10] = -1000;
		memory[2] = I16_SIGNED_SMALLEST_NUMBER;
		test();
		expect(memory[3]).toBe(I16_SIGNED_SMALLEST_NUMBER);
	});
});
