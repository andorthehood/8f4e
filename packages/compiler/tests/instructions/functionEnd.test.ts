import { describe, test, expect } from 'vitest';

import { moduleTesterWithFunctions } from './testUtils';

import compile from '../../src/index';

import type { Module } from '../../src/types';

moduleTesterWithFunctions(
	'functionEnd with int return',
	`module test
int output

loop
  push &output
  call getFortyTwo
  store
loopEnd

moduleEnd`,
	[
		`function getFortyTwo
push 42
functionEnd int`,
	],
	[[{}, { output: 42 }]]
);

moduleTesterWithFunctions(
	'functionEnd with float return',
	`module test
float output

loop
  push &output
  call getPi
  store
loopEnd

moduleEnd`,
	[
		`function getPi
push 3.14
functionEnd float`,
	],
	[[{}, { output: 3.14 }]]
);

moduleTesterWithFunctions(
	'functionEnd validates stack',
	`module test
int output

loop
  push &output
  call addTwo
  store
loopEnd

moduleEnd`,
	[
		`function addTwo
push 5
push 3
add
functionEnd int`,
	],
	[[{}, { output: 8 }]]
);

const defaultOptions = {
	startingMemoryWordAddress: 1,
	memorySizeBytes: 65536,
	includeAST: true,
	disableSharedMemory: true,
};

describe('functionEnd float64 return type', () => {
	test('should accept float64 as a return type and record it in the signature', () => {
		const functions: Module[] = [
			{
				code: ['function getDouble', 'push 3.14f64', 'functionEnd float64'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.getDouble).toBeDefined();
		expect(result.compiledFunctions!.getDouble.signature.returns).toEqual(['float64']);
	});

	test('should reject a float stack item when float64 is the declared return type', () => {
		const functions: Module[] = [
			{
				code: ['function mismatch', 'push 3.14', 'functionEnd float64'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject a float64 stack item when float is the declared return type', () => {
		const functions: Module[] = [
			{
				code: ['function mismatch', 'push 3.14f64', 'functionEnd float'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});
});
