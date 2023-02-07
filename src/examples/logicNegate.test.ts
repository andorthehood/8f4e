import { createTestModule, TestModule } from '@8f4e/compiler';

import negate from './logicNegate.asm';
import { I16_SIGNED_LARGEST_NUMBER } from './consts';

let testModule: TestModule;

const fixtures: [input: number, output: number][] = [
	[1, 0],
	[-69, I16_SIGNED_LARGEST_NUMBER],
	[0, I16_SIGNED_LARGEST_NUMBER],
];

describe('logicNegate', () => {
	beforeAll(async () => {
		testModule = await createTestModule(negate);
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

	test.each(fixtures)('given input %p, the expected output is %p', (input, output) => {
		const { memory, test } = testModule;

		const inAddress = memory.allocMemoryForPointer('in');
		memory.set(inAddress, input);
		test();
		expect(memory.get('out')).toBe(output);
	});
});
