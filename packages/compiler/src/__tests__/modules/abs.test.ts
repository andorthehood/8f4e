import { createTestModule } from '../../testUtils';
import abs from '../../modules/abs';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(abs('id', { byte: nthWord => nthWord * 4, word: nthWord => nthWord })).toMatchSnapshot();
});

const fixtures: [input: number, output: number][] = [
	[1, 1],
	[-1, 1],
	[-69, 69],
	[420, 420],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(abs);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test.each(fixtures)('given %p, returns %p', (input, output) => {
		const { memory, test } = testModule;
		memory[0] = input;
		test();
		expect(memory[2]).toBe(output);
	});
});
