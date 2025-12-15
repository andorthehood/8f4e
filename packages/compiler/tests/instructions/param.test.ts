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

describe('Param Instruction', () => {
	test('should allow accessing parameters in declaration order', () => {
		const functions: Module[] = [
			{
				code: ['function add', 'param int x', 'param int y', 'localGet x', 'localGet y', 'add', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.add).toBeDefined();
		expect(result.compiledFunctions!.add.signature.parameters).toEqual(['int', 'int']);
		expect(result.compiledFunctions!.add.signature.returns).toEqual(['int']);
	});

	test('should allow accessing parameters in different order', () => {
		const functions: Module[] = [
			{
				code: ['function subtract', 'param int x', 'param int y', 'localGet y', 'localGet x', 'sub', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.subtract).toBeDefined();
		expect(result.compiledFunctions!.subtract.signature.parameters).toEqual(['int', 'int']);
	});

	test('should allow accessing only some parameters', () => {
		const functions: Module[] = [
			{
				code: [
					'function useFirst',
					'param int x',
					'param int unused',
					'localGet x',
					'push 2',
					'mul',
					'functionEnd int',
				],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.useFirst).toBeDefined();
		expect(result.compiledFunctions!.useFirst.signature.parameters).toEqual(['int', 'int']);
	});

	test('should allow accessing the same parameter multiple times', () => {
		const functions: Module[] = [
			{
				code: ['function square', 'param int x', 'localGet x', 'localGet x', 'mul', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.square).toBeDefined();
		expect(result.compiledFunctions!.square.signature.parameters).toEqual(['int']);
	});

	test('should work with named parameters for improved readability', () => {
		const functions: Module[] = [
			{
				code: [
					'function calculateArea',
					'param int width',
					'param int height',
					'localGet width',
					'localGet height',
					'mul',
					'functionEnd int',
				],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.calculateArea).toBeDefined();
		expect(result.compiledFunctions!.calculateArea.signature.parameters).toEqual(['int', 'int']);
	});

	test('should work with local variables declared after params', () => {
		const functions: Module[] = [
			{
				code: [
					'function addWithLocal',
					'param int x',
					'param int y',
					'local int temp',
					'localGet x',
					'localGet y',
					'add',
					'localSet temp',
					'localGet temp',
					'functionEnd int',
				],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.addWithLocal).toBeDefined();
		expect(result.compiledFunctions!.addWithLocal.signature.parameters).toEqual(['int', 'int']);
	});

	test('should work with mixed int and float parameters', () => {
		const functions: Module[] = [
			{
				code: [
					'function mixedParams',
					'param int intVal',
					'param float floatVal',
					'localGet intVal',
					'castToFloat',
					'localGet floatVal',
					'mul',
					'functionEnd float',
				],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.mixedParams).toBeDefined();
		expect(result.compiledFunctions!.mixedParams.signature.parameters).toEqual(['int', 'float']);
	});

	test('should reject param instruction outside function', () => {
		const modules: Module[] = [
			{
				code: ['module test', 'param int x', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions)).toThrow();
	});

	test('should reject param instruction after other function body instructions', () => {
		const functions: Module[] = [
			{
				code: ['function invalid', 'push 1', 'param int x', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject param instruction with invalid type', () => {
		const functions: Module[] = [
			{
				code: ['function invalid', 'param invalidType x', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject param instruction with missing arguments', () => {
		const functions: Module[] = [
			{
				code: ['function invalid', 'param int', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject more than 8 parameters', () => {
		const functions: Module[] = [
			{
				code: [
					'function tooMany',
					'param int p1',
					'param int p2',
					'param int p3',
					'param int p4',
					'param int p5',
					'param int p6',
					'param int p7',
					'param int p8',
					'param int p9',
					'functionEnd',
				],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should work with function that has no parameters', () => {
		const functions: Module[] = [
			{
				code: ['function noParams', 'push 42', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.noParams).toBeDefined();
		expect(result.compiledFunctions!.noParams.signature.parameters).toEqual([]);
	});

	test('should reject param after local (param must come before local)', () => {
		// This test ensures param can only come immediately after function, not after local
		const functions: Module[] = [
			{
				code: ['function invalid', 'local int temp', 'param int x', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		// This should fail because param must come before local
		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject duplicate parameter names', () => {
		const functions: Module[] = [
			{
				code: ['function invalid', 'param int x', 'param int x', 'functionEnd'],
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
