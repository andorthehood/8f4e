import { createTestModule, TestModule } from '@8f4e/compiler';

import adc from './adc.asm';
import { LOGIC_HIGH } from './consts';

let testModule: TestModule;

const fixtures: [input: number, outputs: number[]][] = [
	[3000, [LOGIC_HIGH]],
	[2000, [LOGIC_HIGH]],
	[3000, [LOGIC_HIGH]],
];

describe('adc', () => {
	beforeAll(async () => {
		testModule = await createTestModule(adc({ resolution: 8 }));
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the generated ast matches with the snapshot', () => {
		expect(testModule.ast).toMatchSnapshot();
	});

	test('if the wat code matches with the snapshot', () => {
		expect(testModule.wat).toMatchSnapshot();
	});

	test('if the generated memory map matches with the snapshot', () => {
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test.each(fixtures)('given %p as input, the output should be %p', (input, outputs) => {
		const { memory, test } = testModule;

		const inAddress = memory.allocMemoryForPointer('in');
		memory.set(inAddress, input);
		test();
		expect(memory.get('out:1')).toBe(outputs[0]);
	});
});
