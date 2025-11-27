import { describe, test, expect, beforeEach, beforeAll } from 'vitest';

import { createTestModule } from './testUtils';

import type { TestModule } from '../../src/types';

const dup = `module dup

int input 
int output1
int output2

push &output1
push &output2
push input
dup
store
store

moduleEnd
`;

// const fixtures: number[] = [69, 0, -420];

describe('dup', () => {
	let testModule: TestModule;

	beforeAll(async () => {
		testModule = await createTestModule(dup);
	});

	beforeEach(() => {
		testModule.reset();
	});

	test('if the generated AST, WAT and memory map match the snapshot', () => {
		expect(testModule.ast).toMatchSnapshot();
		expect(testModule.wat).toMatchSnapshot();
		expect(testModule.memoryMap).toMatchSnapshot();
	});

	// test.each(fixtures)('', input => {
	// 	const { memory, test } = testModule;
	// 	memory.set('input', input);
	// 	test();
	// 	expect(memory.get('output1')).toBe(input);
	// 	expect(memory.get('output2')).toBe(input);
	// });
});
