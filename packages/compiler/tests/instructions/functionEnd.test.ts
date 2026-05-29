import { describe, expect, test } from 'vitest';

import compile from '../../src/index';

import type { Module } from '../../src/types';

const defaultOptions = {
	startingMemoryWordAddress: 1,
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

		const result = compile({ entries: { main: modules }, functions: functions }, defaultOptions);

		expect(result.compiledFunctions!.getDouble).toBeDefined();
		expect(result.compiledFunctions!.getDouble.signature.returns).toEqual(['float64']);
	});
});
