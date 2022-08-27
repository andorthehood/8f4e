import { createTestModule } from '../../testUtils';
import negate from '../../modules/logicNegate.asm';
import { I16_SIGNED_LARGEST_NUMBER } from '../../consts';
import { compile } from '@8f4e/module-compiler';

let testModule;

const fixtures = [
	[1, 0],
	[-69, I16_SIGNED_LARGEST_NUMBER],
	[0, I16_SIGNED_LARGEST_NUMBER],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(negate);
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

	test.each(fixtures)('given %p, the expected result is %p', (input, output) => {
		const { memory, test } = testModule;

		memory[0] = input;
		test();
		expect(memory[2]).toBe(output);
	});
});
