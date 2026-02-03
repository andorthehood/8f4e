import { describe, test, expect } from 'vitest';

import { compileToAST, compileModule } from '../src/compiler';

describe('macro expansion integration', () => {
	test('should expand macros and compile correctly', () => {
		const code = [
			'; Define a macro for incrementing',
			'defineMacro increment',
			'push 1',
			'add',
			'defineMacroEnd',
			'',
			'module counter',
			'int value 0',
			'',
			'; Use the macro',
			'push value',
			'push 5',
			'macro increment',
			'store',
			'moduleEnd',
		];

		const ast = compileToAST(code);

		// The AST should not contain macro definition lines
		expect(ast.find(line => line.instruction === 'defineMacro')).toBeUndefined();
		expect(ast.find(line => line.instruction === 'defineMacroEnd')).toBeUndefined();
		expect(ast.find(line => line.instruction === 'macro')).toBeUndefined();

		// The AST should contain the expanded macro content
		const pushOne = ast.find(line => line.instruction === 'push' && line.arguments[0]?.value === 1);
		expect(pushOne).toBeDefined();
		expect(pushOne?.lineNumber).toBe(12); // Line where "macro increment" was called

		const add = ast.find(line => line.instruction === 'add');
		expect(add).toBeDefined();
		expect(add?.lineNumber).toBe(12); // Line where "macro increment" was called

		// Should compile without errors
		const compiled = compileModule(ast, {}, {}, 0, 1000, 0);
		expect(compiled.id).toBe('counter');
	});

	test('should report errors with correct line numbers for expanded macros', () => {
		const code = [
			'defineMacro badMacro',
			'push unknownIdentifier', // This will cause an error
			'defineMacroEnd',
			'',
			'module test',
			'macro badMacro', // Line 5
			'moduleEnd',
		];

		try {
			const ast = compileToAST(code);
			compileModule(ast, {}, {}, 0, 1000, 0);
			expect.fail('Should have thrown an error');
		} catch (error: unknown) {
			// The error should reference line 5 (where macro badMacro was called)
			// not line 1 (where the push instruction is in the macro definition)
			const err = error as { line: { lineNumber: number } };
			expect(err.line.lineNumber).toBe(5);
		}
	});

	test('should handle multiple macro expansions', () => {
		const code = [
			'defineMacro loadX',
			'push x',
			'load',
			'defineMacroEnd',
			'',
			'defineMacro storeX',
			'push x',
			'store',
			'defineMacroEnd',
			'',
			'module test',
			'int x 10',
			'',
			'macro loadX',
			'push 1',
			'add',
			'macro storeX',
			'moduleEnd',
		];

		const ast = compileToAST(code);

		// Check that expansions preserve call-site line numbers
		const firstLoad = ast.find(line => line.instruction === 'load');
		expect(firstLoad?.lineNumber).toBe(13); // Line where "macro loadX" was called

		const store = ast.find(line => line.instruction === 'store');
		expect(store?.lineNumber).toBe(16); // Line where "macro storeX" was called

		// Should compile without errors
		const compiled = compileModule(ast, {}, {}, 0, 1000, 0);
		expect(compiled.id).toBe('test');
	});

	test('should detect undefined macro error', () => {
		const code = ['module test', 'macro undefined', 'moduleEnd'];

		expect(() => compileToAST(code)).toThrow();
	});

	test('should detect duplicate macro names', () => {
		const code = ['defineMacro foo', 'push 1', 'defineMacroEnd', 'defineMacro foo', 'push 2', 'defineMacroEnd'];

		expect(() => compileToAST(code)).toThrow();
	});

	test('should detect missing macro end', () => {
		const code = ['defineMacro incomplete', 'push 1', 'module test', 'moduleEnd'];

		expect(() => compileToAST(code)).toThrow();
	});

	test('should prevent nested macro definitions', () => {
		const code = ['defineMacro outer', 'defineMacro inner', 'push 1', 'defineMacroEnd', 'defineMacroEnd'];

		expect(() => compileToAST(code)).toThrow();
	});

	test('should prevent macro calls inside macro bodies', () => {
		const code = ['defineMacro a', 'push 1', 'defineMacroEnd', 'defineMacro b', 'macro a', 'defineMacroEnd'];

		expect(() => compileToAST(code)).toThrow();
	});

	test('macros with comments should work correctly', () => {
		const code = [
			'defineMacro commented',
			'; This is a comment inside the macro',
			'push 1',
			'defineMacroEnd',
			'',
			'module test',
			'int x 0',
			'macro commented',
			'push x',
			'store',
			'moduleEnd',
		];

		const ast = compileToAST(code);
		const compiled = compileModule(ast, {}, {}, 0, 1000, 0);
		expect(compiled.id).toBe('test');
	});
});
