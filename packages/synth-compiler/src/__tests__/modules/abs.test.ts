import { createTestModule } from '../../testUtils';
import abs from '../../modules/abs.asm';

let testModule;

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

	test('if the wat code matches with the snapshot', () => {
		expect(testModule.wat).toMatchSnapshot();
	});

	test('if the generated memory map matches with the snapshot', () => {
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test.each(fixtures)('given %p, returns %p', (input, output) => {
		const { memory, test } = testModule;
		memory[0] = input;
		test();
		expect(memory[2]).toBe(output);
	});
});
