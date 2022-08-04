import { createTestModule } from '../../testUtils';
import abs, { Memory } from '../../modules/attenuator';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(abs('id', { byte: nthWord => nthWord * 4, word: nthWord => nthWord })).toMatchSnapshot();
});

const fixtures: [dividend: number, divisor: number, quotient: number][] = [
	[1, 1, 1],
	[-1, 1, -1],
	[-69, 1, -69],
	[420, 1, 420],
	[420, 2, 210],
	[420, 3, 140],
	[420, 9, 46],
	[420, 420, 1],
	[-420, 420, -1],
	[420, -420, -1],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(abs);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test.each(fixtures)('given %p as dividend and %p as divisor, returns %p', (dividend, divisor, quotient) => {
		const { memory, test } = testModule;
		memory[Memory.ZERO] = dividend;
		memory[Memory.DIVISOR] = divisor;
		test();
		expect(memory[Memory.OUT]).toBe(quotient);
	});
});
