import { createTestModule } from '@8f4e/compiler';

import mixer from '../../../modules/engines/mixer.asm';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../../../modules/engines/consts';

let testModule;

describe('funciontal tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(mixer);
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

	test('negate module', () => {
		const { memory, test } = testModule;

		memory[2] = 10 * memory.BYTES_PER_ELEMENT;
		memory[3] = 11 * memory.BYTES_PER_ELEMENT;
		memory[4] = 12 * memory.BYTES_PER_ELEMENT;
		memory[5] = 13 * memory.BYTES_PER_ELEMENT;

		memory[10] = 1;
		memory[11] = 1;
		memory[12] = 1;
		memory[13] = 1;
		test();
		expect(memory[1]).toBe(4);

		memory[10] = 1;
		memory[11] = -1;
		memory[12] = 1;
		memory[13] = -1;
		test();
		expect(memory[1]).toBe(0);

		memory[10] = I16_SIGNED_LARGEST_NUMBER;
		memory[11] = I16_SIGNED_LARGEST_NUMBER;
		memory[12] = I16_SIGNED_LARGEST_NUMBER;
		memory[13] = I16_SIGNED_LARGEST_NUMBER;
		test();
		expect(memory[1]).toBe(I16_SIGNED_LARGEST_NUMBER);

		memory[10] = I16_SIGNED_SMALLEST_NUMBER;
		memory[11] = I16_SIGNED_SMALLEST_NUMBER;
		memory[12] = I16_SIGNED_SMALLEST_NUMBER;
		memory[13] = I16_SIGNED_SMALLEST_NUMBER;
		test();
		expect(memory[1]).toBe(I16_SIGNED_SMALLEST_NUMBER);
	});
});
