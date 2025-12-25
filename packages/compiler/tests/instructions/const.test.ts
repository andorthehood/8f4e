import { describe, it, expect } from 'vitest';

import { moduleTester } from './testUtils';

import compile from '../../src';

import type { Module } from '../../src/types';

const defaultOptions = {
	startingMemoryWordAddress: 1,
	environmentExtensions: {
		constants: {},
		ignoredKeywords: [],
	},
	memorySizeBytes: 65536,
	includeAST: true,
};

describe('const instruction', () => {
	moduleTester(
		'const with valid constant names',
		`module const

const TEST1 420
const TEST2 420.69
const TEST3 69

int output1
float output2
int output3 TEST3

push &output1
push TEST1
store

push &output2
push TEST2
store

moduleEnd
`,
		[[{}, { output1: 420, output2: 420.69, output3: 69 }]]
	);

	it('should accept constant names with underscores after the first letter', () => {
		const modules: Module[] = [
			{
				code: [
					'module test',
					'const MY_CONSTANT 100',
					'int output MY_CONSTANT',
					'push &output',
					'push MY_CONSTANT',
					'store',
					'moduleEnd',
				],
			},
		];

		expect(() => compile(modules, defaultOptions)).not.toThrow();
	});

	it('should accept constant names with numbers after the first letter', () => {
		const modules: Module[] = [
			{
				code: [
					'module test',
					'const CONST123 100',
					'int output CONST123',
					'push &output',
					'push CONST123',
					'store',
					'moduleEnd',
				],
			},
		];

		expect(() => compile(modules, defaultOptions)).not.toThrow();
	});
});
