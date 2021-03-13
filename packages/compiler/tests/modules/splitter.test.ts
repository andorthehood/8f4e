import { createTestModule } from '../utils';
import splitter from '../../src/modules/splitter';

let testModule;

beforeAll(async () => {
	testModule = await createTestModule(splitter);
});

beforeEach(() => {
	testModule.reset();
});

test('splitter module', () => {
	const { memory, test } = testModule;

	memory[10] = 1;
	memory[1] = 10 * Int32Array.BYTES_PER_ELEMENT;
	test();
	expect(memory[2]).toBe(1);
	expect(memory[3]).toBe(1);
	expect(memory[4]).toBe(1);
	expect(memory[5]).toBe(1);

	memory[10] = 69;
	memory[1] = 10 * Int32Array.BYTES_PER_ELEMENT;
	test();
	expect(memory[2]).toBe(69);
	expect(memory[3]).toBe(69);
	expect(memory[4]).toBe(69);
	expect(memory[5]).toBe(69);

	memory[10] = 420;
	memory[1] = 10 * Int32Array.BYTES_PER_ELEMENT;
	test();
	expect(memory[2]).toBe(420);
	expect(memory[3]).toBe(420);
	expect(memory[4]).toBe(420);
	expect(memory[5]).toBe(420);
});
