import { createTestModule, TestModule } from '@8f4e/compiler';

import offset from './offset.asm';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from './consts';

let testModule: TestModule;

const fixtures: [input: number, offset: number, output: number][] = [
	[10, 10, 20],
	[-10, 10, 0],
	[-100, 10, -90],
	[1000, I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_LARGEST_NUMBER],
	[-1000, I16_SIGNED_SMALLEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER],
];

describe('offset', () => {
	beforeAll(async () => {
		testModule = await createTestModule(offset);
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

	test.each(fixtures)('given input %p and offset %p the expected output is %p', (input, offset, output) => {
		const { memory, test } = testModule;

		const inAddress = memory.allocMemoryForPointer('in');

		memory.set(inAddress, input);
		memory.set('offset', offset);
		test();
		expect(memory.get('out')).toBe(output);
	});
});
