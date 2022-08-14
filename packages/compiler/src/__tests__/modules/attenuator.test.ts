import { createTestModule } from '../../testUtils';
import abs from '../../modules/attenuator.asm';
import { compile } from '@8f4e/module-compiler';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(compile(abs, 'id', 0)).toMatchSnapshot();
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
		memory[0] = dividend;
		memory[2] = divisor;
		test();
		expect(memory[3]).toBe(quotient);
	});
});
