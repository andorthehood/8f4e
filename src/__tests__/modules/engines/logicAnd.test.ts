import { createTestModule } from '@8f4e/synth-compiler';

import and from '../../../modules/engines/logicAnd.asm';
import { I16_SIGNED_LARGEST_NUMBER } from '../../../modules/engines/consts';

let testModule;

const fixtures = [
	[10, 10, I16_SIGNED_LARGEST_NUMBER],
	[0, 10, 0],
	[10, 0, 0],
	[0, 0, 0],
	[-10, 0, 0],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(and);
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

	test.each(fixtures)('given %p and %p, the expected result is %p', (a, b, expected) => {
		const { memory, test } = testModule;

		memory[1] = 10 * memory.BYTES_PER_ELEMENT;
		memory[2] = 11 * memory.BYTES_PER_ELEMENT;

		memory[10] = a;
		memory[11] = b;
		test();
		expect(memory[3]).toBe(expected);
	});
});
