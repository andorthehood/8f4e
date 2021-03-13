import { createTestModule } from '../utils';
import constant, { Memory } from '../../src/modules/constant';

let testModule;

beforeAll(async () => {
	testModule = await createTestModule(constant, { out: 0 });
});

beforeEach(() => {
	testModule.reset();
});

test('constant module', () => {
	const { memory, test } = testModule;

	memory[Memory.OUTPUT] = 1;
	test();
	expect(memory[Memory.OUTPUT]).toBe(1);

	memory[Memory.OUTPUT] = -69;
	test();
	expect(memory[Memory.OUTPUT]).toBe(-69);
});
