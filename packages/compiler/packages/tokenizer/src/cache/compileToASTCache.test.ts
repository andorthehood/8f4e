import { describe, expect, it } from 'vitest';

import createASTCache from './createASTCache';
import type { InternalASTCache } from './types';

import { compileToAST } from '../parser';

describe('compileToAST cache', () => {
	it('returns cached AST when source and line metadata are unchanged', () => {
		const cache: InternalASTCache = createASTCache();
		const code = ['push 10', 'push 20', 'add'];
		const lineMetadata = [
			{ callSiteLineNumber: 4 },
			{ callSiteLineNumber: 4, macroId: 'sum' },
			{ callSiteLineNumber: 4, macroId: 'sum' },
		];
		const first = compileToAST(code, lineMetadata, cache, 'module:0');
		const second = compileToAST(code, lineMetadata, cache, 'module:0');

		expect(second).toBe(first);
		expect(cache.entries.get('module:0')?.ast).toBe(first);
		expect(cache.stats).toEqual({ hits: 1, misses: 1 });
	});

	it('reparses when source changes for the same cache key', () => {
		const cache: InternalASTCache = createASTCache();
		const first = compileToAST(['push 10'], undefined, cache, 'module:0');
		const second = compileToAST(['push 20'], undefined, cache, 'module:0');

		expect(second).not.toBe(first);
		expect(second[0].arguments[0]).toMatchObject({ value: 20 });
		expect(cache.stats).toEqual({ hits: 0, misses: 2 });
	});

	it('reparses when line metadata changes for the same source', () => {
		const cache: InternalASTCache = createASTCache();
		const code = ['push 10'];
		const first = compileToAST(code, [{ callSiteLineNumber: 1 }], cache, 'module:0');
		const second = compileToAST(code, [{ callSiteLineNumber: 2 }], cache, 'module:0');

		expect(second).not.toBe(first);
		expect(second[0].lineNumberBeforeMacroExpansion).toBe(2);
		expect(cache.stats).toEqual({ hits: 0, misses: 2 });
	});

	it('keeps distinct cache keys independent', () => {
		const cache: InternalASTCache = createASTCache();
		const moduleAst = compileToAST(['push 10'], undefined, cache, 'module:0');
		const functionAst = compileToAST(['push 10'], undefined, cache, 'function:0');

		expect(functionAst).not.toBe(moduleAst);
		expect(cache.entries.get('module:0')?.ast).toBe(moduleAst);
		expect(cache.entries.get('function:0')?.ast).toBe(functionAst);
		expect(cache.stats).toEqual({ hits: 0, misses: 2 });
	});
});
