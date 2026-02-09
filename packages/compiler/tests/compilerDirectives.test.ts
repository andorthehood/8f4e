import { describe, test, expect } from 'vitest';

import compile from '../src';

import type { Module } from '../src/types';

describe('compiler directive: #skipExecution', () => {
	const baseOptions = {
		startingMemoryWordAddress: 0,
		memorySizeBytes: 65536,
	};

	test('module with #skipExecution is omitted from cycle dispatcher', () => {
		const modules: Module[] = [
			{
				code: [
					'module moduleA',
					'#skipExecution',
					'int counter 0',
					'push counter',
					'push counter',
					'load',
					'push 1',
					'add',
					'store',
					'moduleEnd',
				],
			},
			{
				code: ['module moduleB', 'int value 42', 'moduleEnd'],
			},
		];

		const result = compile(modules, baseOptions);

		// moduleA should have skipExecutionInCycle flag
		expect(result.compiledModules.moduleA.skipExecutionInCycle).toBe(true);
		expect(result.compiledModules.moduleB.skipExecutionInCycle).toBeUndefined();
	});

	test('module with #skipExecution still compiles normally', () => {
		const modules: Module[] = [
			{
				code: [
					'module test',
					'#skipExecution',
					'int counter 0',
					'int* pointer &counter',
					'push counter',
					'push 1',
					'store',
					'moduleEnd',
				],
			},
		];

		const result = compile(modules, baseOptions);

		// Module should be compiled with memory map
		expect(result.compiledModules.test).toBeDefined();
		expect(result.compiledModules.test.memoryMap).toBeDefined();
		expect(result.compiledModules.test.memoryMap.counter).toBeDefined();
		expect(result.compiledModules.test.memoryMap.pointer).toBeDefined();

		// Module should have a cycle function (even though it won't be called)
		expect(result.compiledModules.test.cycleFunction).toBeDefined();
		expect(result.compiledModules.test.cycleFunction.length).toBeGreaterThan(0);
	});

	test('duplicate #skipExecution directives are idempotent', () => {
		const modules: Module[] = [
			{
				code: ['module test', '#skipExecution', '#skipExecution', '#skipExecution', 'int value 0', 'moduleEnd'],
			},
		];

		const result = compile(modules, baseOptions);

		expect(result.compiledModules.test.skipExecutionInCycle).toBe(true);
	});

	test('inter-module memory references to skipExecution module still work', () => {
		const modules: Module[] = [
			{
				code: ['module moduleA', '#skipExecution', 'int sharedValue 100', 'moduleEnd'],
			},
			{
				code: ['module moduleB', 'int* pointer &moduleA.sharedValue', 'moduleEnd'],
			},
		];

		const result = compile(modules, baseOptions);

		// Both modules should compile successfully
		expect(result.compiledModules.moduleA).toBeDefined();
		expect(result.compiledModules.moduleB).toBeDefined();

		// moduleB's pointer should reference moduleA's memory
		expect(result.compiledModules.moduleB.memoryMap.pointer).toBeDefined();
	});

	test('#skipExecution in constants block throws error', () => {
		const modules: Module[] = [
			{
				code: ['constants env', '#skipExecution', 'const SAMPLE_RATE int 44100', 'constantsEnd'],
			},
		];

		expect(() => compile(modules, baseOptions)).toThrow();
	});

	test('unknown directive throws error', () => {
		const modules: Module[] = [
			{
				code: ['module test', '#unknownDirective', 'int value 0', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, baseOptions)).toThrow();
	});

	test('#skipExecution in function context throws error', () => {
		const functions: Module[] = [
			{
				code: ['function testFunc', 'param int x', 'returns int', '#skipExecution', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'int value 0', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, baseOptions, functions)).toThrow();
	});

	test('multiple modules with #skipExecution', () => {
		const modules: Module[] = [
			{
				code: ['module moduleA', '#skipExecution', 'int value 1', 'moduleEnd'],
			},
			{
				code: ['module moduleB', 'int value 2', 'moduleEnd'],
			},
			{
				code: ['module moduleC', '#skipExecution', 'int value 3', 'moduleEnd'],
			},
		];

		const result = compile(modules, baseOptions);

		expect(result.compiledModules.moduleA.skipExecutionInCycle).toBe(true);
		expect(result.compiledModules.moduleB.skipExecutionInCycle).toBeUndefined();
		expect(result.compiledModules.moduleC.skipExecutionInCycle).toBe(true);
	});

	test('module memory initialization still occurs for #skipExecution modules', () => {
		const modules: Module[] = [
			{
				code: ['module test', '#skipExecution', 'int value 42', 'int defaultValue 0', 'float pi 3.14', 'moduleEnd'],
			},
		];

		const result = compile(modules, { ...baseOptions, includeAST: true });

		// Memory map should contain the variables with their defaults
		expect(result.compiledModules.test.memoryMap.value).toBeDefined();
		expect(result.compiledModules.test.memoryMap.value.default).toBe(42);
		expect(result.compiledModules.test.memoryMap.defaultValue).toBeDefined();
		expect(result.compiledModules.test.memoryMap.defaultValue.default).toBe(0);
		expect(result.compiledModules.test.memoryMap.pi).toBeDefined();
		expect(result.compiledModules.test.memoryMap.pi.default).toBeCloseTo(3.14);
	});

	test('#skipExecution can appear anywhere in module block', () => {
		const modules: Module[] = [
			{
				code: ['module test', 'int value 0', '#skipExecution', 'push value', 'push 1', 'store', 'moduleEnd'],
			},
		];

		const result = compile(modules, baseOptions);

		expect(result.compiledModules.test.skipExecutionInCycle).toBe(true);
	});

	test('#skipExecution at beginning of module', () => {
		const modules: Module[] = [
			{
				code: ['#skipExecution', 'module test', 'int value 0', 'moduleEnd'],
			},
		];

		const result = compile(modules, baseOptions);

		expect(result.compiledModules.test.skipExecutionInCycle).toBe(true);
	});
});
