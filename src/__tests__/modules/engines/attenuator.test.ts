import { createTestModule } from '@8f4e/synth-compiler';

import abs from '../../../modules/engines/attenuator.asm';

let testModule;

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

	test('if the wat code matches with the snapshot', () => {
		expect(testModule.wat).toMatchSnapshot();
	});

	test('if the generated memory map matches with the snapshot', () => {
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test.each(fixtures)('given %p as dividend and %p as divisor, returns %p', (dividend, divisor, quotient) => {
		const { memory, test } = testModule;
		memory[0] = dividend;
		memory[2] = divisor;
		test();
		expect(memory[3]).toBe(quotient);
	});
});
