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

describe('function instruction', () => {
	test('should compile a function with no parameters', () => {
		const functions: Module[] = [
			{
				code: ['function noop', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions).toBeDefined();
		expect(result.compiledFunctions!.noop).toBeDefined();
		expect(result.compiledFunctions!.noop.signature.parameters).toEqual([]);
	});

	test('should compile a function with int parameters', () => {
		const functions: Module[] = [
			{
				code: ['function add int int', 'add', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.add.signature.parameters).toEqual(['int', 'int']);
	});

	test('should compile a function with float parameters', () => {
		const functions: Module[] = [
			{
				code: ['function mul float float', 'mul', 'functionEnd float'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.mul.signature.parameters).toEqual(['float', 'float']);
	});

	test('should compile a function with mixed parameter types', () => {
		const functions: Module[] = [
			{
				code: ['function mixed int float', 'drop', 'castToFloat', 'functionEnd float'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.mixed.signature.parameters).toEqual(['int', 'float']);
	});

	test('should reject function with more than 8 parameters', () => {
		const functions: Module[] = [
			{
				code: ['function tooMany int int int int int int int int int', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject function with invalid parameter type', () => {
		const functions: Module[] = [
			{
				code: ['function invalid invalidType', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject function without name', () => {
		const functions: Module[] = [
			{
				code: ['function', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject nested functions', () => {
		const functions: Module[] = [
			{
				code: ['function outer', 'function inner', 'functionEnd', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should compile and use function in module', () => {
		const functions: Module[] = [
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
					'push 5',
					'push 3',
					'call add',
					'store',
					'loopEnd',
					'moduleEnd',
				],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.codeBuffer).toBeDefined();
		expect(result.compiledFunctions!.add).toBeDefined();
		expect(result.compiledModules.test).toBeDefined();
	});
});
