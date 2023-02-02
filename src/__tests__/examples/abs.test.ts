import { createTestModule, TestModule } from '@8f4e/compiler';

import abs from '../../examples/abs.asm';

let testModule: TestModule;

const fixtures: [input: number, output: number][] = [
	[1, 1],
	[-1, 1],
	[-69, 69],
	[420, 420],
];

describe('abs', () => {
	beforeAll(async () => {
		testModule = await createTestModule(abs);
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

	test.each(fixtures)('given input %p, the output should be %p', (input, output) => {
		const { memory, test } = testModule;

		const inAddress = memory.allocMemoryForPointer('in');
		memory.set(inAddress, input);
		test();
		expect(memory.get('out')).toBe(output);
	});
});
