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

describe('functionEnd instruction', () => {
	test('should compile function with no return value', () => {
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

		expect(result.compiledFunctions!.noop.signature.returns).toEqual([]);
	});

	test('should compile function with int return value', () => {
		const functions: Module[] = [
			{
				code: ['function getInt', 'push 42', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.getInt.signature.returns).toEqual(['int']);
	});

	test('should compile function with float return value', () => {
		const functions: Module[] = [
			{
				code: ['function getFloat', 'push 3.14', 'functionEnd float'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.getFloat.signature.returns).toEqual(['float']);
	});

	test('should compile function with multiple return values', () => {
		const functions: Module[] = [
			{
				code: ['function getTwoInts', 'push 1', 'push 2', 'functionEnd int int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.getTwoInts.signature.returns).toEqual(['int', 'int']);
	});

	test('should reject function with more than 8 return values', () => {
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

	test('should reject function with invalid return type', () => {
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

	test('should reject function with stack mismatch', () => {
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

	test('should reject function with type mismatch', () => {
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

	test('should reject functionEnd without function', () => {
		const modules: Module[] = [
			{
				code: ['module test', 'functionEnd', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions)).toThrow();
	});

	test('should assign type index to function', () => {
		const functions: Module[] = [
			{
				code: ['function test int', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		expect(result.compiledFunctions!.test.typeIndex).toBeDefined();
		expect(typeof result.compiledFunctions!.test.typeIndex).toBe('number');
	});

	test('should deduplicate function type signatures', () => {
		const functions: Module[] = [
			{
				code: ['function add1 int int', 'add', 'functionEnd int'],
			},
			{
				code: ['function add2 int int', 'add', 'functionEnd int'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module test', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions, functions);

		// Both functions should have the same type index since they have the same signature
		expect(result.compiledFunctions!.add1.typeIndex).toBe(result.compiledFunctions!.add2.typeIndex);
	});
});
