import { SyntaxErrorCode, SyntaxRulesError } from '@8f4e/tokenizer';
import { describe, it, expect } from 'vitest';

import compile from '../../src';

import type { Module } from '../../src/types';

const defaultOptions = {
	startingMemoryWordAddress: 1,
	includeAST: true,
};

describe('const instruction', () => {
	it('should reject constant names with lowercase letters', () => {
		const modules: Module[] = [
			{
				code: ['module test', 'const myConst 100', 'moduleEnd'],
			},
		];

		try {
			compile({ entries: { main: modules } }, defaultOptions);
			throw new Error('Expected compile to throw');
		} catch (error) {
			expect(error).toBeInstanceOf(SyntaxRulesError);
			expect((error as SyntaxRulesError).code).toBe(SyntaxErrorCode.INVALID_ARGUMENT);
		}
	});

	it('should reject constant names starting with numbers', () => {
		const modules: Module[] = [
			{
				code: ['module test', 'const 123ABC 100', 'moduleEnd'],
			},
		];

		try {
			compile({ entries: { main: modules } }, defaultOptions);
			throw new Error('Expected compile to throw');
		} catch (error) {
			expect(error).toBeInstanceOf(SyntaxRulesError);
			expect((error as SyntaxRulesError).code).toBe(SyntaxErrorCode.INVALID_IDENTIFIER);
		}
	});

	it('should reject constant names starting with special characters', () => {
		const modules: Module[] = [
			{
				code: ['module test', 'const _CONST 100', 'moduleEnd'],
			},
		];

		try {
			compile({ entries: { main: modules } }, defaultOptions);
			throw new Error('Expected compile to throw');
		} catch (error) {
			expect(error).toBeInstanceOf(SyntaxRulesError);
			expect((error as SyntaxRulesError).code).toBe(SyntaxErrorCode.INVALID_ARGUMENT);
		}
	});

	it('should accept constant names with underscores after the first letter', () => {
		const modules: Module[] = [
			{
				code: [
					'module test',
					'const MY_CONSTANT 100',
					'int output MY_CONSTANT',
					'push &output',
					'push MY_CONSTANT',
					'store',
					'moduleEnd',
				],
			},
		];

		expect(() => compile({ entries: { main: modules } }, defaultOptions)).not.toThrow();
	});

	it('should accept constant names with numbers after the first letter', () => {
		const modules: Module[] = [
			{
				code: [
					'module test',
					'const CONST123 100',
					'int output CONST123',
					'push &output',
					'push CONST123',
					'store',
					'moduleEnd',
				],
			},
		];

		expect(() => compile({ entries: { main: modules } }, defaultOptions)).not.toThrow();
	});
});
