import { createTestModule, TestModule } from '@8f4e/compiler';

import abs from '../../../modules/engines/attenuator.asm';

let testModule: TestModule;

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

describe('attenuator', () => {
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

		const inAddress = memory.allocMemoryForPointer('in');
		memory.set(inAddress, dividend);
		memory.set('divisor', divisor);
		test();
		expect(memory.get('out')).toBe(quotient);
	});
});
