import quantizer from './quantizer.asm';

import { createTestModule } from '../testUtils';
import { TestModule } from '../types';

let testModule: TestModule;

const fixtures: [input: number, notes: number[], output: number][] = [
	[1000, [], 0],
	[800, [], 0],
	[400, [], 0],

	[0, [900], 900],
	[1000, [900], 900],
	[800, [900], 900],
	[400, [900], 900],

	[900, [1000, 500], 1000],
	[800, [1000, 500], 1000],
	[400, [1000, 500, 100], 500],
	[500, [1000, 500, 100], 500],
	[600, [1000, 500, 100], 500],

	[-900, [-1000, 500], -1000],
	[-800, [-1000, 500], -1000],
	[-400, [-1000, 500], -1000],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(quantizer());
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

	test('quantizer module', () => {
		const { memory, test } = testModule;
		test();
		expect(memory[1]).toBe(0);
	});

	test.each(fixtures)('given %p as input, %p as active notes, the expected output is %p', (input, notes, output) => {
		const { memory, test } = testModule;

		const inAddress = memory.allocMemoryForPointer('in');

		memory.set('numberOfNotes', notes.length);

		memory.set('notes', notes);

		memory.set(inAddress, input);
		test();
		expect(memory.get('out')).toBe(output);
	});
});
