import { createTestModule } from '../../testUtils';
import quantizer, { Memory } from '../../modules/quantizer';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(quantizer('id', { byte: () => 0, word: () => 0 })).toMatchSnapshot();
});

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
	[400, [1000, 500], 500],

	[-900, [-1000, 500], -1000],
	[-800, [-1000, 500], -1000],
	[-400, [-1000, 500], -1000],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(quantizer);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('quantizer module', () => {
		const { memory, test } = testModule;
		test();
		expect(memory[Memory.OUTPUT]).toBe(0);
	});

	test.each(fixtures)('given %p as input, %p as active notes, the expected output is %p', (input, notes, output) => {
		const { memory, test } = testModule;

		memory[Memory.INPUT_POINTER] = 100 * memory.BYTES_PER_ELEMENT;

		memory[Memory.NUMBER_OF_NOTES] = notes.length;

		notes.forEach((note, index) => {
			memory[Memory.FIRST_NOTE + index] = note;
		});

		memory[100] = input;
		test();
		expect(memory[Memory.OUTPUT]).toBe(output);
	});
});
