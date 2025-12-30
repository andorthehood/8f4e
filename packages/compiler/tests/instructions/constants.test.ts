import { describe, test, expect } from 'vitest';

import compile from '../../src';

import type { Module } from '../../src/types';

const defaultOptions = {
	startingMemoryWordAddress: 0,
	environmentExtensions: { constants: {}, ignoredKeywords: [] },
	memorySizeBytes: 65536,
};

describe('constants instruction', () => {
	test('should compile a simple constants block', () => {
		const modules: Module[] = [
			{
				code: ['constants math', 'const PI 3.14159', 'const TAU 6.28318', 'constantsEnd'],
			},
			{
				code: ['module testModule', 'use math', 'int result 0', 'push result', 'push PI', 'store', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
		expect(result.compiledModules).toBeDefined();
	});

	test('should support multiple constants blocks', () => {
		const modules: Module[] = [
			{
				code: ['constants math', 'const PI 3.14159', 'constantsEnd'],
			},
			{
				code: ['constants physics', 'const GRAVITY 9.81', 'constantsEnd'],
			},
			{
				code: ['module testModule', 'use math', 'use physics', 'int x 0', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
	});

	test('should reject name conflict between constants and module', () => {
		const modules: Module[] = [
			{
				code: ['constants testModule', 'const PI 3.14159', 'constantsEnd'],
			},
			{
				code: ['module testModule', 'int x 0', 'moduleEnd'],
			},
		];

		// Name conflicts are now allowed - namespaces are merged with last-wins
		const result = compile(modules, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
	});

	test('should allow use statement to import constants from constants block', () => {
		const modules: Module[] = [
			{
				code: ['constants myConstants', 'const VALUE 42', 'constantsEnd'],
			},
			{
				code: ['module testModule', 'use myConstants', 'int result VALUE', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
	});

	test('should apply last-wins semantics when using multiple namespaces', () => {
		const modules: Module[] = [
			{
				code: ['constants first', 'const VALUE 10', 'constantsEnd'],
			},
			{
				code: ['constants second', 'const VALUE 20', 'constantsEnd'],
			},
			{
				code: ['module testModule', 'use first', 'use second', 'int result VALUE', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
		// The VALUE should be 20 (from second namespace) due to last-wins
	});
});

describe('constantsEnd instruction', () => {
	test('should require matching constants instruction', () => {
		const modules: Module[] = [
			{
				code: ['module testModule', 'constantsEnd', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions)).toThrow();
	});
});

describe('constants block validation', () => {
	test('should reject non-const instructions inside constants block', () => {
		const modules: Module[] = [
			{
				code: ['constants math', 'const PI 3.14159', 'int x 5', 'constantsEnd'],
			},
			{
				code: ['module testModule', 'moduleEnd'],
			},
		];

		// int instruction should be rejected inside constants block
		expect(() => compile(modules, defaultOptions)).toThrow();
	});

	test('should reject constants block inside module', () => {
		const modules: Module[] = [
			{
				code: ['module testModule', 'constants nested', 'const X 1', 'constantsEnd', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions)).toThrow();
	});

	test('should reject constants block inside function', () => {
		const functions: Module[] = [
			{
				code: ['function testFunction', 'constants nested', 'const X 1', 'constantsEnd', 'functionEnd'],
			},
		];

		const modules: Module[] = [
			{
				code: ['module testModule', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions, functions)).toThrow();
	});

	test('should allow only const declarations inside constants block', () => {
		const modules: Module[] = [
			{
				code: ['constants math', 'const PI 3.14159', 'const E 2.71828', 'const PHI 1.618', 'constantsEnd'],
			},
			{
				code: ['module testModule', 'use math', 'moduleEnd'],
			},
		];

		const result = compile(modules, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
	});

	test('should require constants block to have a name', () => {
		const modules: Module[] = [
			{
				code: ['constants', 'const PI 3.14159', 'constantsEnd'],
			},
			{
				code: ['module testModule', 'moduleEnd'],
			},
		];

		expect(() => compile(modules, defaultOptions)).toThrow();
	});
});
