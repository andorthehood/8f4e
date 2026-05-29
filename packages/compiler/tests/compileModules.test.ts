import { compileToAST } from '@8f4e/tokenizer';
import { describe, test, expect } from 'vitest';
import { ErrorCode } from '@8f4e/compiler-spec';

import modules from './__fixtures__/modules';

import { compileModules } from '../src';
import compile from '../src';

describe('compiler', () => {
	test('compileModules', () => {
		const astModules = modules.map(({ code }) => {
			const ast = compileToAST(code);
			if (ast.type === 'function') {
				throw new Error('Expected module AST.');
			}
			return ast;
		});
		expect(
			compileModules(astModules, {
				startingMemoryWordAddress: 0,
				includeAST: true,
			})
		).toMatchSnapshot();
	});

	test('compile function excludes AST by default', () => {
		const result = compile(
			{ groups: { main: modules } },
			{
				startingMemoryWordAddress: 0,
			}
		);

		// Verify that none of the compiled modules have an ast property
		for (const [, module] of Object.entries(result.compiledModules)) {
			expect(module.ast).toBeUndefined();
		}
	});

	test('compile function excludes stack analysis by default', () => {
		const result = compile(
			{
				groups: { main: [{ code: ['module test', 'push 1', 'drop', 'moduleEnd'] }] },
				functions: [{ code: ['function noop', 'functionEnd'] }],
			},
			{
				startingMemoryWordAddress: 0,
			}
		);

		expect(result.compiledModules.test.stackAnalysis).toBeUndefined();
		expect(result.compiledFunctions!.noop.stackAnalysis).toBeUndefined();
	});

	test('compile function includes AST when includeAST is true', () => {
		const result = compile(
			{ groups: { main: modules } },
			{
				startingMemoryWordAddress: 0,
				includeAST: true,
			}
		);

		// Verify that all compiled modules have an ast property
		for (const [, module] of Object.entries(result.compiledModules)) {
			expect(module.ast).toBeDefined();
			expect(module.ast?.lines).toBeDefined();
		}
	});

	test('compile function accepts executable modules grouped by name', () => {
		const result = compile(
			{
				groups: {
					main: [{ code: ['module first', 'int value', 'moduleEnd'] }],
					aux: [{ code: ['module second', 'int value', 'moduleEnd'] }],
				},
			},
			{ startingMemoryWordAddress: 0 }
		);

		expect(Object.keys(result.compiledModules)).toEqual(['first', 'second']);
	});

	test('compile function includes module stack analysis when includeStackAnalysis is true', () => {
		const result = compile(
			{ groups: { main: [{ code: ['module test', 'int output', 'push &output', 'push 1', 'store', 'moduleEnd'] }] } },
			{
				startingMemoryWordAddress: 0,
				includeStackAnalysis: true,
			}
		);

		expect(result.compiledModules.test.ast).toBeUndefined();
		expect(result.compiledModules.test.stackAnalysis?.map(line => line.instruction)).toEqual(['push', 'push', 'store']);
		expect(result.compiledModules.test.stackAnalysis?.[1]).toMatchObject({
			lineNumberBeforeMacroExpansion: 3,
			lineNumberAfterMacroExpansion: 3,
			instruction: 'push',
			stackAnalysis: {
				stackBefore: [{ kind: 'address', valueType: 'int', isNonZero: true }],
				consumedOperands: [],
				producedStackItems: [{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 1 }],
				stackAfter: [
					{ kind: 'address', valueType: 'int', isNonZero: true },
					{ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 1 },
				],
			},
		});
	});

	test('compile function includes function stack analysis when includeStackAnalysis is true', () => {
		const result = compile(
			{
				groups: { main: [{ code: ['module test', 'moduleEnd'] }] },
				functions: [
					{ code: ['function double', 'param int value', 'push value', 'push value', 'add', 'functionEnd int'] },
				],
			},
			{
				startingMemoryWordAddress: 0,
				includeStackAnalysis: true,
			}
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
					{ kind: 'value', valueType: 'int', isNonZero: false },
					{ kind: 'value', valueType: 'int', isNonZero: false },
				],
				producedStackItems: [{ kind: 'value', valueType: 'int', isNonZero: false }],
			},
		});
	});

	test('includeAST and includeStackAnalysis can be enabled together', () => {
		const result = compile(
			{ groups: { main: [{ code: ['module test', 'push 1', 'drop', 'moduleEnd'] }] } },
			{
				startingMemoryWordAddress: 0,
				includeAST: true,
				includeStackAnalysis: true,
			}
		);

		expect(result.compiledModules.test.ast).toBeDefined();
		expect(result.compiledModules.test.stackAnalysis?.map(line => line.instruction)).toEqual(['push', 'drop']);
	});

	test('rejects duplicate module ids', () => {
		expect(() =>
			compile(
				{
					groups: {
						main: [
							{ code: ['module same', 'int a 1', 'moduleEnd'] },
							{ code: ['module same', 'int b 2', 'moduleEnd'] },
						],
					},
				},
				{
					startingMemoryWordAddress: 0,
				}
			)
		).toThrow(`${ErrorCode.DUPLICATE_IDENTIFIER}`);
	});
});
