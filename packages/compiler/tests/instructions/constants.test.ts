import { describe, test, expect } from 'vitest';

import compile from '../../src';

import type { Module } from '../../src/types';

const defaultOptions = {
	startingMemoryWordAddress: 0,
};

describe('constants instruction', () => {
	test('should compile a simple constants block', () => {
		const constants: Module[] = [
			{
				code: ['constants math', 'const PI 3.14159', 'const TAU 6.28318', 'constantsEnd'],
			},
		];
		const modules: Module[] = [
			{
				code: ['module testModule', 'use math', 'int result 0', 'push result', 'push PI', 'store', 'moduleEnd'],
			},
		];

		const result = compile({ groups: { main: modules }, constants }, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
		expect(result.compiledModules).toBeDefined();
		expect(result.compiledModules.math).toBeUndefined();
	});

	test('should support multiple constants blocks', () => {
		const constants: Module[] = [
			{
				code: ['constants math', 'const PI 3.14159', 'constantsEnd'],
			},
			{
				code: ['constants physics', 'const GRAVITY 9.81', 'constantsEnd'],
			},
		];
		const modules: Module[] = [
			{
				code: ['module testModule', 'use math', 'use physics', 'int x 0', 'moduleEnd'],
			},
		];

		const result = compile({ groups: { main: modules }, constants }, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
		expect(result.compiledModules.math).toBeUndefined();
		expect(result.compiledModules.physics).toBeUndefined();
	});

	test('should allow same name for constants block and module (last-wins semantics)', () => {
		const constants: Module[] = [
			{
				code: ['constants testModule', 'const PI 3.14159', 'constantsEnd'],
			},
		];
		const modules: Module[] = [
			{
				code: ['module testModule', 'int x 0', 'moduleEnd'],
			},
		];

		// Name conflicts are allowed - namespaces are merged with last-wins
		const result = compile({ groups: { main: modules }, constants }, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
	});

	test('should allow use statement to import constants from constants block', () => {
		const constants: Module[] = [
			{
				code: ['constants myConstants', 'const VALUE 42', 'constantsEnd'],
			},
		];
		const modules: Module[] = [
			{
				code: ['module testModule', 'use myConstants', 'int result VALUE', 'moduleEnd'],
			},
		];

		const result = compile({ groups: { main: modules }, constants }, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
	});

	test('should apply last-wins semantics when using multiple namespaces', () => {
		const constants: Module[] = [
			{
				code: ['constants first', 'const VALUE 10', 'constantsEnd'],
			},
			{
				code: ['constants second', 'const VALUE 20', 'constantsEnd'],
			},
		];
		const modules: Module[] = [
			{
				code: ['module testModule', 'use first', 'use second', 'int result VALUE', 'moduleEnd'],
			},
		];

		const result = compile({ groups: { main: modules }, constants }, defaultOptions);
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

		expect(() => compile({ groups: { main: modules } }, defaultOptions)).toThrow();
	});
});

describe('const scoping and import rules', () => {
	test('const declared in module A is not visible in module B without use', () => {
		const modules: Module[] = [
			{
				code: ['module moduleA', 'const SECRET 99', 'moduleEnd'],
			},
			{
				code: ['module moduleB', 'int result SECRET', 'moduleEnd'],
			},
		];

		expect(() => compile({ groups: { main: modules } }, defaultOptions)).toThrow();
	});

	test('const declared in module A becomes visible in module B after use', () => {
		const modules: Module[] = [
			{
				code: ['module moduleA', 'const SECRET 99', 'moduleEnd'],
			},
			{
				code: ['module moduleB', 'use moduleA', 'int result SECRET', 'moduleEnd'],
			},
		];

		const result = compile({ groups: { main: modules } }, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
		expect(result.compiledModules.moduleB.memoryMap.result.default).toBe(99);
	});

	test('const value derived from another const in the same module resolves correctly', () => {
		const modules: Module[] = [
			{
				code: ['module testModule', 'const BASE 10', 'const DOUBLE BASE', 'int result DOUBLE', 'moduleEnd'],
			},
		];

		const result = compile({ groups: { main: modules } }, defaultOptions);
		expect(result.compiledModules.testModule.memoryMap.result.default).toBe(10);
	});

	test('use with undeclared namespace throws', () => {
		const modules: Module[] = [
			{
				code: ['module testModule', 'use missingNamespace', 'int x 0', 'moduleEnd'],
			},
		];

		expect(() => compile({ groups: { main: modules } }, defaultOptions)).toThrow();
	});

	test('const with undeclared identifier as value throws', () => {
		const modules: Module[] = [
			{
				code: ['module testModule', 'const RESULT UNDEFINED_CONST', 'int x RESULT', 'moduleEnd'],
			},
		];

		expect(() => compile({ groups: { main: modules } }, defaultOptions)).toThrow();
	});

	test('const with undeclared expression operand throws', () => {
		const modules: Module[] = [
			{
				code: ['module testModule', 'const RESULT UNDEFINED_CONST/2', 'int x RESULT', 'moduleEnd'],
			},
		];

		expect(() => compile({ groups: { main: modules } }, defaultOptions)).toThrow();
	});

	test('forward const reference within a module throws', () => {
		// Declaration order is significant: a const may only reference identifiers
		// that appear in earlier declarations or were imported via a preceding `use`.
		const modules: Module[] = [
			{
				code: ['module testModule', 'const B A', 'const A 10', 'int x B', 'moduleEnd'],
			},
		];

		expect(() => compile({ groups: { main: modules } }, defaultOptions)).toThrow();
	});

	test('use before const allows subsequent const to reference imported value', () => {
		const modules: Module[] = [
			{
				code: ['module moduleA', 'const FOO 42', 'moduleEnd'],
			},
			{
				code: ['module moduleB', 'use moduleA', 'const BAR FOO', 'int x BAR', 'moduleEnd'],
			},
		];

		const result = compile({ groups: { main: modules } }, defaultOptions);
		expect(result.compiledModules.moduleB.memoryMap.x.default).toBe(42);
	});

	test('const before use cannot reference values from that use', () => {
		// Declaration order is significant: `use` only imports into scope from its position onward.
		const modules: Module[] = [
			{
				code: ['module moduleA', 'const FOO 42', 'moduleEnd'],
			},
			{
				code: ['module moduleB', 'const BAR FOO', 'use moduleA', 'int x BAR', 'moduleEnd'],
			},
		];

		expect(() => compile({ groups: { main: modules } }, defaultOptions)).toThrow();
	});
});

describe('constants block validation', () => {
	test('should reject non-const instructions inside constants block', () => {
		const constants: Module[] = [
			{
				code: ['constants math', 'const PI 3.14159', 'int x 5', 'constantsEnd'],
			},
		];
		const modules: Module[] = [
			{
				code: ['module testModule', 'moduleEnd'],
			},
		];

		// int instruction should be rejected inside constants block
		expect(() => compile({ groups: { main: modules }, constants }, defaultOptions)).toThrow();
	});

	test('should reject constants block inside module', () => {
		const modules: Module[] = [
			{
				code: ['module testModule', 'constants nested', 'const X 1', 'constantsEnd', 'moduleEnd'],
			},
		];

		expect(() => compile({ groups: { main: modules } }, defaultOptions)).toThrow();
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

		expect(() => compile({ groups: { main: modules }, functions: functions }, defaultOptions)).toThrow();
	});

	test('should allow const declarations inside constants block', () => {
		const constants: Module[] = [
			{
				code: ['constants math', 'const PI 3.14159', 'const E 2.71828', 'const PHI 1.618', 'constantsEnd'],
			},
		];
		const modules: Module[] = [
			{
				code: ['module testModule', 'use math', 'moduleEnd'],
			},
		];

		const result = compile({ groups: { main: modules }, constants }, defaultOptions);
		expect(result.codeBuffer).toBeDefined();
	});

	test('should allow constants blocks to use other constants blocks', () => {
		const constants: Module[] = [
			{
				code: ['constants math', 'use env', 'const SIZE SAMPLE_RATE/1000', 'constantsEnd'],
			},
			{
				code: ['constants env', '#mock', 'const SAMPLE_RATE 48000', 'constantsEnd'],
			},
		];
		const modules: Module[] = [
			{
				code: ['module testModule', 'use math', 'int x SIZE', 'moduleEnd'],
			},
		];

		const result = compile({ groups: { main: modules }, constants }, defaultOptions);

		expect(result.compiledModules.testModule.memoryMap.x.default).toBe(48);
	});

	test('should require constants block to have a name', () => {
		const constants: Module[] = [
			{
				code: ['constants', 'const PI 3.14159', 'constantsEnd'],
			},
		];
		const modules: Module[] = [
			{
				code: ['module testModule', 'moduleEnd'],
			},
		];

		expect(() => compile({ groups: { main: modules }, constants }, defaultOptions)).toThrow();
	});
});
