import { createTestModule } from '@8f4e/compiler';

import adc from '../../../modules/engines/adc.asm';
import { LOGIC_HIGH } from '../../../modules/engines/consts';

let testModule;

const fixtures = [
	[3000, LOGIC_HIGH],
	[2000, LOGIC_HIGH],
	[3000, LOGIC_HIGH],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(adc(), { resolution: 8 });
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

	test.each(fixtures)('given %p the output should be %p', (input, output) => {
		const { memory, test } = testModule;

		memory[0] = input;
		test();
		expect(memory[2]).toBe(output);
	});
});
