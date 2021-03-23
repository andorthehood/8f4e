import { createTestModule } from '../utils';
import random, { Memory } from '../../src/modules/random';

let testModule;

beforeAll(async () => {
	testModule = await createTestModule(random);
});

beforeEach(() => {
	testModule.reset();
});

test('offset module', () => {
	const { memory, test } = testModule;

	memory[Memory.OUTPUT] = 69420;

	test();
	expect(memory[Memory.OUTPUT]).toBe(-30826);

	test();
	expect(memory[Memory.OUTPUT]).toBe(-15413);

	test();
	expect(memory[Memory.OUTPUT]).toBe(-7707);

	test();
	expect(memory[Memory.OUTPUT]).toBe(28915);

	test();
	expect(memory[Memory.OUTPUT]).toBe(-18312);

	test();
	expect(memory[Memory.OUTPUT]).toBe(-9156);
});
