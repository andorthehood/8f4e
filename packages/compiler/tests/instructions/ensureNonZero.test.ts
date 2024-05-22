import { createTestModule } from './testUtils';

import { TestModule } from '../../src/types';

describe('ensureNonZero (int)', () => {
	let testModule: TestModule;

	const ensureNonZero = `module ensureNonZero
    int input 
    int output
    
    push &output
    push input
    ensureNonZero
    store
    
    moduleEnd
    `;

	const fixtures: number[] = [69, 0, -420];

	beforeAll(async () => {
		testModule = await createTestModule(ensureNonZero);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the generated AST, WAT and memory map match the snapshot', () => {
		expect(testModule.ast).toMatchSnapshot();
		expect(testModule.wat).toMatchSnapshot();
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test.each(fixtures)('', input => {
		const { memory, test } = testModule;
		memory.set('input', input);
		test();
		expect(memory.get('output1')).not.toBe(0);
	});
});

describe('ensureNonZero (float)', () => {
	let testModule: TestModule;

	const ensureNonZero = `module ensureNonZero
    float input 
    float output
    
    push &output
    push input
    ensureNonZero
    store
    
    moduleEnd
    `;

	const fixtures: number[] = [69.1, 0, -420.1];

	beforeAll(async () => {
		testModule = await createTestModule(ensureNonZero);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the generated AST, WAT and memory map match the snapshot', () => {
		expect(testModule.ast).toMatchSnapshot();
		expect(testModule.wat).toMatchSnapshot();
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test.each(fixtures)('', input => {
		const { memory, test } = testModule;
		memory.set('input', input);
		test();
		expect(memory.get('output1')).not.toBe(0);
	});
});
