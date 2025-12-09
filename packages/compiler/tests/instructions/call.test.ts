import { describe, test, expect } from 'vitest';

import compile from '../../src/index';

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

describe('call instruction', () => {
	test('should call a function with no parameters', () => {
		const functions: Module[] = [
			{
				code: ['function noop', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'loop', 'call noop', 'loopEnd', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.codeBuffer).toBeDefined();
		expect(result.compiledModules.test).toBeDefined();
	});

	test('should call a function with parameters', () => {
		const functions: Module[] = [
			{
				code: ['function square int', 'dup', 'mul', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: [
					'module test',
					'int result',
					'loop',
					'push &result',
					'push 5',
					'call square',
					'store',
					'loopEnd',
					'moduleEnd',
				],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.codeBuffer).toBeDefined();
		expect(result.compiledModules.test).toBeDefined();
	});

	test('should call a function with multiple parameters', () => {
		const functions: Module[] = [
			{
				code: ['function add int int', 'add', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: [
					'module test',
					'int result',
					'loop',
					'push &result',
					'push 3',
					'push 4',
					'call add',
					'store',
					'loopEnd',
					'moduleEnd',
				],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.codeBuffer).toBeDefined();
	});

	test('should call a function with multiple return values', () => {
		const functions: Module[] = [
			{
				code: ['function swap int int', 'swap', 'functionEnd int int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'loop', 'push 1', 'push 2', 'call swap', 'drop', 'drop', 'loopEnd', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.codeBuffer).toBeDefined();
	});

	test('should call function from init block', () => {
		const functions: Module[] = [
			{
				code: ['function getZero', 'push 0', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'int x', 'initBlock', 'push &x', 'call getZero', 'store', 'initBlockEnd', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.codeBuffer).toBeDefined();
	});

	test('should reject call to undefined function', () => {
		const modules: Module[] = [
			{
				code: ['module test', 'loop', 'call undefined', 'loopEnd', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions)).toThrow();
	});

	test('should reject call with insufficient arguments', () => {
		const functions: Module[] = [
			{
				code: ['function add int int', 'add', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'loop', 'push 1', 'call add', 'drop', 'loopEnd', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject call with wrong argument types', () => {
		const functions: Module[] = [
			{
				code: ['function addInts int int', 'add', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'loop', 'push 1.5', 'push 2.5', 'call addInts', 'drop', 'loopEnd', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject call outside module or function', () => {
		const functions: Module[] = [
			{
				code: ['function noop', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['call noop', 'module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject call without function name', () => {
		const modules: Module[] = [
			{
				code: ['module test', 'loop', 'call', 'loopEnd', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions)).toThrow();
	});

	test('should allow calling multiple different functions', () => {
		const functions: Module[] = [
			{
				code: ['function add int int', 'add', 'functionEnd int'],
			},
			{
				code: ['function mul int int', 'mul', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: [
					'module test',
					'loop',
					'push 2',
					'push 3',
					'call add',
					'push 4',
					'call mul',
					'drop',
					'loopEnd',
					'moduleEnd',
				],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.codeBuffer).toBeDefined();
	});

	test('should compile complex function usage', () => {
		const functions: Module[] = [
			{
				code: ['function square int', 'dup', 'mul', 'functionEnd int'],
			},
			{
				code: ['function add int int', 'add', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: [
					'module test',
					'int output',
					'loop',
					'push &output',
					'push 3',
					'call square',
					'push 4',
					'call square',
					'call add',
					'store',
					'loopEnd',
					'moduleEnd',
				],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.codeBuffer).toBeDefined();
		expect(result.compiledFunctions!.square).toBeDefined();
		expect(result.compiledFunctions!.add).toBeDefined();
	});
});
