import { createTestModule, TestModule } from '@8f4e/compiler';

import constant from '../../../modules/engines/constant.asm';

let testModule: TestModule;

const fixtures = [1, -69];

describe('constant', () => {
	beforeAll(async () => {
		testModule = await createTestModule(constant);
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

	test.each(fixtures)('given input %p the output should be the same', input => {
		const { memory, test } = testModule;

		memory.set('out', input);
		test();
		expect(memory.get('out')).toBe(input);
	});
});
