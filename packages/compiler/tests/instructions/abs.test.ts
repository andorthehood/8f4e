import { createTestModule } from './testUtils';

import { TestModule } from '../../src/types';

describe('abs (int)', () => {
	const abs = `module abs

    int input 
    int output
    
    push &output
    push input
    abs
    store
    
    moduleEnd
    `;

	const fixtures: [input: number, output: number][] = [
		[1, 1],
		[-1, 1],
		[-69, 69],
		[420, 420],
	];

	let testModule: TestModule;

	beforeAll(async () => {
		testModule = await createTestModule(abs);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the generated AST, WAT and memory map match the snapshot', () => {
		expect(testModule.ast).toMatchSnapshot();
		expect(testModule.wat).toMatchSnapshot();
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test.each(fixtures)('given input: %p, the output should be: %p', (input, output) => {
		const { memory, test } = testModule;
		memory.set('input', input);
		test();
		expect(memory.get('output')).toBe(output);
	});
});

describe('abs (float)', () => {
	const abs = `module abs

    float input 
    float output
    
    push &output
    push input
    abs
    store
    
    moduleEnd
    `;

	const fixtures: [input: number, output: number][] = [
		[1.1, 1.1],
		[-1.1, 1.1],
		[-69.1, 69.1],
		[420.1, 420.1],
	];

	let testModule: TestModule;

	beforeAll(async () => {
		testModule = await createTestModule(abs);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the generated AST, WAT and memory map match the snapshot', () => {
		expect(testModule.ast).toMatchSnapshot();
		expect(testModule.wat).toMatchSnapshot();
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	test.each(fixtures)('given input: %p, the output should be: %p', (input, output) => {
		const { memory, test } = testModule;
		memory.set('input', input);
		test();
		expect(memory.get('output')).toBeCloseTo(output);
	});
});
