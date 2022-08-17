import { createTestModule } from '../../testUtils';
import adc from '../../modules/adc';
import { LOGIC_HIGH } from '../../consts';
import { compile } from '@8f4e/module-compiler';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(compile(adc(), 'id', 0)).toMatchSnapshot();
});

const fixtures = [
	[3000, LOGIC_HIGH],
	[2000, LOGIC_HIGH],
	[3000, LOGIC_HIGH],
];

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(adc(), { resolution: 8 });
	});

	beforeEach(() => {
		testModule.reset();
	});

	test.each(fixtures)('given %p the output should be %p', (input, output) => {
		const { memory, test } = testModule;

		memory[0] = input;
		test();
		expect(memory[2]).toBe(output);
	});
});
