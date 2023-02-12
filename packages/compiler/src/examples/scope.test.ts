import scope from './scope.asm';

import { createTestModule } from '../testUtils';
import { TestModule } from '../types';

let testModule: TestModule;

describe('functional tests', () => {
	beforeAll(async () => {
		testModule = await createTestModule(scope);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the generated ast matches with the snapshot', () => {
		expect(testModule.ast).toMatchSnapshot();
	});

	test('if the wat code matches with the snapshot', () => {
		expect(testModule.wat).toMatchSnapshot();
	});

	test('if the generated memory map matches with the snapshot', () => {
		expect(testModule.memoryMap).toMatchSnapshot();
	});
});
