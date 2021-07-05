import { createTestModule } from '../../testUtils';
import splitter from '../../modules/splitter';

let testModule;

test('if compiled module matches with snapshot', () => {
	expect(splitter('id', () => 0)).toMatchSnapshot();
});

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(splitter);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('splitter module', () => {
		const { memory, test } = testModule;

		memory[1] = 10 * memory.BYTES_PER_ELEMENT;

		memory[10] = 1;
		test();
		expect(memory[2]).toBe(1);
		expect(memory[3]).toBe(1);
		expect(memory[4]).toBe(1);
		expect(memory[5]).toBe(1);

		memory[10] = 69;
		test();
		expect(memory[2]).toBe(69);
		expect(memory[3]).toBe(69);
		expect(memory[4]).toBe(69);
		expect(memory[5]).toBe(69);

		memory[10] = 420;
		test();
		expect(memory[2]).toBe(420);
		expect(memory[3]).toBe(420);
		expect(memory[4]).toBe(420);
		expect(memory[5]).toBe(420);
	});
});
