import { compileToAST } from '@8f4e/tokenizer';
import { describe, test, expect } from 'vitest';
import { ErrorCode } from '@8f4e/compiler-spec';

import modules from './__fixtures__/modules';

import { compileModules } from '../src';
import compile from '../src';

describe('compiler', () => {
	test('compileModules', () => {
		const astModules = modules.map(({ code }) => compileToAST(code));
		expect(
			compileModules(astModules, {
				startingMemoryWordAddress: 0,
				includeAST: true,
			})
		).toMatchSnapshot();
	});

	test('compile function excludes AST by default', () => {
		const result = compile(modules, {
			startingMemoryWordAddress: 0,
		});

		// Verify that none of the compiled modules have an ast property
		for (const [, module] of Object.entries(result.compiledModules)) {
			expect(module.ast).toBeUndefined();
		}
	});

	test('compile function excludes stack analysis by default', () => {
		const result = compile(
			[{ code: ['module test', 'push 1', 'drop', 'moduleEnd'] }],
			{
				startingMemoryWordAddress: 0,
			},
			[{ code: ['function noop', 'functionEnd'] }]
		);

		expect(result.compiledModules.test.stackAnalysis).toBeUndefined();
		expect(result.compiledFunctions!.noop.stackAnalysis).toBeUndefined();
	});

	test('compile function includes AST when includeAST is true', () => {
		const result = compile(modules, {
			startingMemoryWordAddress: 0,
			includeAST: true,
		});

		// Verify that all compiled modules have an ast property
		for (const [, module] of Object.entries(result.compiledModules)) {
			expect(module.ast).toBeDefined();
			expect(Array.isArray(module.ast)).toBe(true);
		}
	});

	test('compile function includes module stack analysis when includeStackAnalysis is true', () => {
		const result = compile([{ code: ['module test', 'int output', 'push &output', 'push 1', 'store', 'moduleEnd'] }], {
			startingMemoryWordAddress: 0,
			includeStackAnalysis: true,
		});

		expect(result.compiledModules.test.ast).toBeUndefined();
		expect(result.compiledModules.test.stackAnalysis?.map(line => line.instruction)).toEqual(['push', 'push', 'store']);
		expect(result.compiledModules.test.stackAnalysis?.[1]).toMatchObject({
			lineNumberBeforeMacroExpansion: 3,
			lineNumberAfterMacroExpansion: 3,
			instruction: 'push',
			stackAnalysis: {
				stackBefore: [{ isInteger: true, isNonZero: true }],
				consumedOperands: [],
				producedStackItems: [{ isInteger: true, isNonZero: true, knownIntegerValue: 1 }],
				stackAfter: [
					{ isInteger: true, isNonZero: true },
					{ isInteger: true, isNonZero: true, knownIntegerValue: 1 },
				],
			},
		});
	});

	test('compile function includes function stack analysis when includeStackAnalysis is true', () => {
		const result = compile(
			[{ code: ['module test', 'moduleEnd'] }],
			{
				startingMemoryWordAddress: 0,
				includeStackAnalysis: true,
			},
			[{ code: ['function double', 'param int value', 'push value', 'push value', 'add', 'functionEnd int'] }]
		);

		expect(result.compiledFunctions!.double.stackAnalysis?.map(line => line.instruction)).toEqual([
			'function',
			'param',
			'push',
			'push',
			'add',
			'functionEnd',
		]);
		expect(result.compiledFunctions!.double.stackAnalysis?.[4]).toMatchObject({
			instruction: 'add',
			stackAnalysis: {
				consumedOperands: [
					{ isInteger: true, isNonZero: false },
					{ isInteger: true, isNonZero: false },
				],
				producedStackItems: [{ isInteger: true, isNonZero: false }],
			},
		});
	});

	test('includeAST and includeStackAnalysis can be enabled together', () => {
		const result = compile([{ code: ['module test', 'push 1', 'drop', 'moduleEnd'] }], {
			startingMemoryWordAddress: 0,
			includeAST: true,
			includeStackAnalysis: true,
		});

		expect(result.compiledModules.test.ast).toBeDefined();
		expect(result.compiledModules.test.stackAnalysis?.map(line => line.instruction)).toEqual(['push', 'drop']);
	});

	test('rejects duplicate module ids', () => {
		expect(() =>
			compile([{ code: ['module same', 'int a 1', 'moduleEnd'] }, { code: ['module same', 'int b 2', 'moduleEnd'] }], {
				startingMemoryWordAddress: 0,
			})
		).toThrow(`${ErrorCode.DUPLICATE_IDENTIFIER}`);
	});
});
