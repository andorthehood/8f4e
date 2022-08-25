import { createTestModule } from '../../testUtils';
import quantizer from '../../modules/quantizer.asm';
import { compile } from '@8f4e/module-compiler';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(compile(quantizer({ allocatedNotes: 12 }), 'id', 0)).toMatchSnapshot();
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
	[400, [1000, 500, 100], 500],
	[500, [1000, 500, 100], 500],
	[600, [1000, 500, 100], 500],

	[-900, [-1000, 500], -1000],
	[-800, [-1000, 500], -1000],
	[-400, [-1000, 500], -1000],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(quantizer({ allocatedNotes: 12 }));
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('quantizer module', () => {
		const { memory, test } = testModule;
		test();
		expect(memory[1]).toBe(0);
	});

	test.each(fixtures)('given %p as input, %p as active notes, the expected output is %p', (input, notes, output) => {
		const { memory, test } = testModule;

		memory[0] = 100 * memory.BYTES_PER_ELEMENT;

		memory[3] = notes.length;

		notes.forEach((note, index) => {
			memory[4 + index] = note;
		});

		memory[100] = input;
		test();
		expect(memory[1]).toBe(output);
	});
});
