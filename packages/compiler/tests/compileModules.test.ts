import { compileToAST } from '@8f4e/tokenizer';
import { describe, test, expect } from 'vitest';

import modules from './__fixtures__/modules';

import { ErrorCode } from '../src/compilerError';
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

	test('rejects duplicate module ids', () => {
		expect(() =>
			compile([{ code: ['module same', 'int a 1', 'moduleEnd'] }, { code: ['module same', 'int b 2', 'moduleEnd'] }], {
				startingMemoryWordAddress: 0,
			})
		).toThrow(`${ErrorCode.DUPLICATE_IDENTIFIER}`);
	});

	test('keeps followed modules contiguous in final memory layout', () => {
		const result = compile(
			[
				{ code: ['module gamma', 'int c 3', 'moduleEnd'] },
				{ code: ['module beta', '#follow alpha', 'int b 2', 'moduleEnd'] },
				{ code: ['module alpha', 'int a 1', 'moduleEnd'] },
			],
			{
				startingMemoryWordAddress: 0,
			}
		);

		expect(result.compiledModules.alpha.byteAddress).toBe(4);
		expect(result.compiledModules.beta.byteAddress).toBe(8);
		expect(result.compiledModules.gamma.byteAddress).toBe(12);
	});

	test('rejects missing #follow targets during compile', () => {
		expect(() =>
			compile(
				[
					{ code: ['module alpha', '#follow missing', 'int a 1', 'moduleEnd'] },
					{ code: ['module beta', 'int b 2', 'moduleEnd'] },
				],
				{
					startingMemoryWordAddress: 0,
				}
			)
		).toThrow(`${ErrorCode.MODULE_FOLLOW_TARGET_NOT_FOUND}`);
	});
});
