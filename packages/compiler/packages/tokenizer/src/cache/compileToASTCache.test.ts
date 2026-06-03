import type { ValidatedAST } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';
import { compileToAST } from '../index';
import createASTCache from './createASTCache';
import hashSource from './hashSource';

describe('compileToAST cache', () => {
	it('returns cached AST when source is unchanged', () => {
		const cache = createASTCache<ValidatedAST>();
		const code = ['module test', 'push 10', 'push 20', 'add', 'moduleEnd'];
		const first = compileToAST(code, cache, 'module:0');
		const second = compileToAST(code, cache, 'module:0');

		expect(second).toBe(first);
		expect(cache.entries.get('module:0')).toMatchObject({
			ast: first,
			hash: hashSource(code),
		});
		expect(cache.entries.get('module:0')?.hashInput).toBeUndefined();
		expect(cache.stats).toEqual({ hits: 1, misses: 1 });
	});

	it('stores obvious cache misses without hashing the source', () => {
		const cache = createASTCache<ValidatedAST>();
		const code = ['module test', 'push 10', 'moduleEnd'];
		const ast = compileToAST(code, cache, 'module:0');
		const entry = cache.entries.get('module:0');

		expect(entry).toMatchObject({
			ast,
			hashInput: {
				code,
			},
			lineCount: code.length,
		});
		expect(entry?.hash).toBeUndefined();
	});

	it('reparses when source changes for the same cache key', () => {
		const cache = createASTCache<ValidatedAST>();
		const first = compileToAST(['module test', 'push 10', 'moduleEnd'], cache, 'module:0');
		const second = compileToAST(['module test', 'push 20', 'moduleEnd'], cache, 'module:0');

		expect(second).not.toBe(first);
		expect(second.lines[1].arguments[0]).toMatchObject({ value: 20 });
		expect(cache.stats).toEqual({ hits: 0, misses: 2 });
	});

	it('reparses when source line count changes for the same cache key', () => {
		const cache = createASTCache<ValidatedAST>();
		const first = compileToAST(['module test', 'push 10', 'moduleEnd'], cache, 'module:0');
		const second = compileToAST(['module test', 'push 10', 'push 20', 'moduleEnd'], cache, 'module:0');

		expect(second).not.toBe(first);
		expect(cache.entries.get('module:0')).toMatchObject({
			ast: second,
			lineCount: 4,
		});
		expect(cache.stats).toEqual({ hits: 0, misses: 2 });
	});

	it('keeps distinct cache keys independent', () => {
		const cache = createASTCache<ValidatedAST>();
		const moduleAst = compileToAST(['module test', 'push 10', 'moduleEnd'], cache, 'module:0');
		const functionAst = compileToAST(['function test', 'push 10', 'functionEnd'], cache, 'function:0');

		expect(functionAst).not.toBe(moduleAst);
		expect(cache.entries.get('module:0')?.ast).toBe(moduleAst);
		expect(cache.entries.get('function:0')?.ast).toBe(functionAst);
		expect(cache.stats).toEqual({ hits: 0, misses: 2 });
	});
});
