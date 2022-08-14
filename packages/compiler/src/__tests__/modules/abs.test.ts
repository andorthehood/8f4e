import { createTestModule } from '../../testUtils';
import abs from '../../modules/abs.asm';
import { compile } from '@8f4e/module-compiler';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(compile(abs, 'id', 0)).toMatchSnapshot();
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
