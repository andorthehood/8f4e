import type { CompilerASTLines } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';
import { compileToASTLines } from '../parser';
import createASTCache from './createASTCache';
import hashSource from './hashSource';

describe('compileToASTLines cache', () => {
	it('returns cached AST when source is unchanged', () => {
		const cache = createASTCache<CompilerASTLines>();
		const code = ['push 10', 'push 20', 'add'];
		const first = compileToASTLines(code, cache, 'module:0');
		const second = compileToASTLines(code, cache, 'module:0');

		expect(second).toBe(first);
		expect(cache.entries.get('module:0')).toMatchObject({
			ast: first,
			hash: hashSource(code),
		});
		expect(cache.entries.get('module:0')?.hashInput).toBeUndefined();
		expect(cache.stats).toEqual({ hits: 1, misses: 1 });
	});

	it('stores obvious cache misses without hashing the source', () => {
		const cache = createASTCache<CompilerASTLines>();
		const code = ['push 10'];
		const ast = compileToASTLines(code, cache, 'module:0');
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
		const cache = createASTCache<CompilerASTLines>();
		const first = compileToASTLines(['push 10'], cache, 'module:0');
		const second = compileToASTLines(['push 20'], cache, 'module:0');

		expect(second).not.toBe(first);
		expect(second[0].arguments[0]).toMatchObject({ value: 20 });
		expect(cache.stats).toEqual({ hits: 0, misses: 2 });
	});

	it('reparses when source line count changes for the same cache key', () => {
		const cache = createASTCache<CompilerASTLines>();
		const first = compileToASTLines(['push 10'], cache, 'module:0');
		const second = compileToASTLines(['push 10', 'push 20'], cache, 'module:0');

		expect(second).not.toBe(first);
		expect(cache.entries.get('module:0')).toMatchObject({
			ast: second,
			lineCount: 2,
		});
		expect(cache.stats).toEqual({ hits: 0, misses: 2 });
	});

	it('keeps distinct cache keys independent', () => {
		const cache = createASTCache<CompilerASTLines>();
		const moduleAst = compileToASTLines(['push 10'], cache, 'module:0');
		const functionAst = compileToASTLines(['push 10'], cache, 'function:0');

		expect(functionAst).not.toBe(moduleAst);
		expect(cache.entries.get('module:0')?.ast).toBe(moduleAst);
		expect(cache.entries.get('function:0')?.ast).toBe(functionAst);
		expect(cache.stats).toEqual({ hits: 0, misses: 2 });
	});
});
