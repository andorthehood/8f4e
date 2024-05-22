import { createTestModule } from './testUtils';

import { TestModule } from '../../src/types';

const branchIfUnchanged = `module branchIfUnchanged

int input 
int output

block void
 push input
 branchIfUnchanged 1 ; Return before the output is set to 1
 push &output
  push 1
 store
blockEnd

moduleEnd
`;

describe('branchIfUnchanged', () => {
	let testModule: TestModule;

	beforeAll(async () => {
		testModule = await createTestModule(branchIfUnchanged);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the generated AST, WAT and memory map match the snapshot', () => {
		expect(testModule.ast).toMatchSnapshot();
		expect(testModule.wat).toMatchSnapshot();
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test('', () => {
		const { memory, test } = testModule;

		memory.set('input', 0);
		test();
		test();
		test();
		test();
		expect(memory.get('output')).toBe(0);
	});

	test('', () => {
		const { memory, test } = testModule;

		memory.set('input', 0);
		test();
		memory.set('input', 1);
		test();
		expect(memory.get('output')).toBe(1);
	});
});
