import { describe, test, expect } from 'vitest';

import compile from '../src/index';

import type { Module } from '../src/types';

const defaultOptions = {
	startingMemoryWordAddress: 1,
	environmentExtensions: {
		constants: {},
	},
	memorySizeBytes: 65536,
	includeAST: true,
};

describe('Pure Function Compilation', () => {
	test('should compile a simple function with no parameters and no return value', () => {
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
		expect(result.compiledFunctions!.noop.id).toBe('noop');
		expect(result.compiledFunctions!.noop.signature.parameters).toEqual([]);
		expect(result.compiledFunctions!.noop.signature.returns).toEqual([]);
		expect(result.compiledFunctions!.noop.wasmIndex).toBeDefined();
	});

	test('should compile a function with int parameters', () => {
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

	test('should compile a function with float parameters', () => {
		const functions: Module[] = [
			{
				code: [
					'function multiply',
					'param float x',
					'param float y',
					'localGet x',
					'localGet y',
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

		expect(result.compiledFunctions!.multiply).toBeDefined();
		expect(result.compiledFunctions!.multiply.signature.parameters).toEqual(['float', 'float']);
		expect(result.compiledFunctions!.multiply.signature.returns).toEqual(['float']);
	});

	test('should compile a function with mixed int and float parameters', () => {
		const functions: Module[] = [
			{
				code: [
					'function convert',
					'param int x',
					'param float y',
					'localGet x',
					'localGet y',
					'drop',
					'castToFloat',
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

		expect(result.compiledFunctions!.convert).toBeDefined();
		expect(result.compiledFunctions!.convert.signature.parameters).toEqual(['int', 'float']);
		expect(result.compiledFunctions!.convert.signature.returns).toEqual(['float']);
	});

	test('should compile a function with multiple return values', () => {
		const functions: Module[] = [
			{
				code: ['function duplicate', 'param int x', 'localGet x', 'dup', 'functionEnd int int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.duplicate).toBeDefined();
		expect(result.compiledFunctions!.duplicate.signature.parameters).toEqual(['int']);
		expect(result.compiledFunctions!.duplicate.signature.returns).toEqual(['int', 'int']);
	});

	test('should support calling a function from a module', () => {
		const functions: Module[] = [
			{
				code: ['function square', 'param int x', 'localGet x', 'dup', 'mul', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'loop', 'push 5', 'call square', 'drop', 'loopEnd', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.square).toBeDefined();
		expect(result.compiledModules.test).toBeDefined();
		// The module should compile successfully if the call instruction works
		expect(result.codeBuffer).toBeDefined();
	});

	test('should support local variables in functions', () => {
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
		expect(result.compiledFunctions!.addWithLocal.signature.returns).toEqual(['int']);
	});

	test('should support constants in functions', () => {
		const functions: Module[] = [
			{
				code: ['const PI 3.14159', 'function getPi', 'push PI', 'functionEnd float'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.getPi).toBeDefined();
		expect(result.compiledFunctions!.getPi.signature.parameters).toEqual([]);
		expect(result.compiledFunctions!.getPi.signature.returns).toEqual(['float']);
	});

	test('should compile multiple functions', () => {
		const functions: Module[] = [
			{
				code: ['function add', 'param int x', 'param int y', 'localGet x', 'localGet y', 'add', 'functionEnd int'],
			},
			{
				code: ['function sub', 'param int x', 'param int y', 'localGet x', 'localGet y', 'sub', 'functionEnd int'],
			},
			{
				code: ['function mul', 'param int x', 'param int y', 'localGet x', 'localGet y', 'mul', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(Object.keys(result.compiledFunctions!)).toHaveLength(3);
		expect(result.compiledFunctions!.add).toBeDefined();
		expect(result.compiledFunctions!.sub).toBeDefined();
		expect(result.compiledFunctions!.mul).toBeDefined();

		// Each should have unique WASM indices
		const indices = Object.values(result.compiledFunctions!).map(f => f.wasmIndex);
		expect(new Set(indices).size).toBe(3);
	});
});

describe('Pure Function Validation', () => {
	test('should reject memory declarations in functions', () => {
		const functions: Module[] = [
			{
				code: ['function invalid', 'int x 0', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow(
			/Memory access is not allowed in pure functions|This instruction can only be used within a block or a module/i
		);
	});

	test('should reject load operations in functions', () => {
		const functions: Module[] = [
			{
				code: ['function invalid', 'param int x', 'localGet x', 'load', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow(
			/Memory access is not allowed in pure functions|This instruction can only be used within a block or a module/i
		);
	});

	test('should reject store operations in functions', () => {
		const functions: Module[] = [
			{
				code: ['function invalid', 'param int x', 'param int y', 'localGet x', 'localGet y', 'store', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow(
			/Memory access is not allowed in pure functions|This instruction can only be used within a block or a module/i
		);
	});

	test('should reject buffer declarations in functions', () => {
		const functions: Module[] = [
			{
				code: ['function invalid', 'int[] buffer 10', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow(
			/Memory access is not allowed in pure functions|This instruction can only be used within a block or a module/i
		);
	});

	test('should reject functions with more than 8 parameters', () => {
		const functions: Module[] = [
			{
				code: [
					'function tooManyParams',
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

	test('should reject functions with more than 8 return values', () => {
		const functions: Module[] = [
			{
				code: [
					'function tooManyReturns',
					'push 1',
					'push 2',
					'push 3',
					'push 4',
					'push 5',
					'push 6',
					'push 7',
					'push 8',
					'push 9',
					'functionEnd int int int int int int int int int',
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

	test('should reject invalid parameter types', () => {
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

	test('should reject invalid return types', () => {
		const functions: Module[] = [
			{
				code: ['function invalid', 'push 1', 'functionEnd invalidType'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject stack mismatch at functionEnd', () => {
		const functions: Module[] = [
			{
				code: ['function mismatch', 'push 1', 'push 2', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject type mismatch in return values', () => {
		const functions: Module[] = [
			{
				code: ['function typeMismatch', 'push 1.5', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject calling undefined function from module', () => {
		const modules: Module[] = [
			{
				code: ['module test', 'loop', 'push 5', 'call undefinedFunc', 'drop', 'loopEnd', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions)).toThrow();
	});

	test('should reject function call with wrong argument types', () => {
		const functions: Module[] = [
			{
				code: ['function addInts', 'param int x', 'param int y', 'localGet x', 'localGet y', 'add', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'loop', 'push 1.5', 'push 2.5', 'call addInts', 'drop', 'loopEnd', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should reject function call with insufficient arguments', () => {
		const functions: Module[] = [
			{
				code: ['function add', 'param int x', 'param int y', 'localGet x', 'localGet y', 'add', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'loop', 'push 1', 'call add', 'drop', 'loopEnd', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});
});

describe('Pure Function Edge Cases', () => {
	test('should handle function with zero parameters and zero return values', () => {
		const functions: Module[] = [
			{
				code: ['function doNothing', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'loop', 'call doNothing', 'loopEnd', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);
		expect(result.compiledFunctions!.doNothing).toBeDefined();
	});

	test('should handle function calling from init block', () => {
		const functions: Module[] = [
			{
				code: ['function getZero', 'push 0', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'int x 0', 'initBlock', 'call getZero', 'drop', 'initBlockEnd', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);
		expect(result.compiledFunctions!.getZero).toBeDefined();
		expect(result.compiledModules.test).toBeDefined();
	});

	test('should support control flow in functions', () => {
		const functions: Module[] = [
			{
				code: [
					'function abs',
					'param int x',
					'localGet x',
					'dup',
					'push 0',
					'lessThan',
					'if int',
					'push -1',
					'mul',
					'ifEnd',
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
		expect(result.compiledFunctions!.abs).toBeDefined();
	});

	test('should handle functions that use stack manipulation', () => {
		const functions: Module[] = [
			{
				code: [
					'function swapAndAdd',
					'param int x',
					'param int y',
					'localGet x',
					'localGet y',
					'swap',
					'add',
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
		expect(result.compiledFunctions!.swapAndAdd).toBeDefined();
	});
});
