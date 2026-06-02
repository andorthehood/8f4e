import { describe, expect, test } from 'vitest';

import { compileFixtureProgramSource } from './testUtils';

describe('compiler options and cache', () => {
	test('always exposes AST and exposes stack analysis only when requested', () => {
		const source = `
8f4e/v1

entry main
module optionSurface
int output
push &output
push 1
store
moduleEnd
entryEnd

function double
param int value
push value
push value
add
functionEnd int
`;
		const defaultResult = compileFixtureProgramSource(source).compileResult;
		const analyzedResult = compileFixtureProgramSource(source, {
			includeStackAnalysis: true,
		}).compileResult;

		expect(defaultResult.compiledModules.optionSurface.ast.id).toBe('optionSurface');
		expect(defaultResult.compiledModules.optionSurface.stackAnalysis).toBeUndefined();
		expect(defaultResult.compiledFunctions!.double.stackAnalysis).toBeUndefined();

		expect(analyzedResult.compiledModules.optionSurface.ast.id).toBe('optionSurface');
		expect(analyzedResult.compiledModules.optionSurface.stackAnalysis?.map(line => line.instruction)).toEqual([
			'push',
			'push',
			'store',
		]);
		expect(analyzedResult.compiledFunctions!.double.stackAnalysis?.map(line => line.instruction)).toEqual([
			'function',
			'param',
			'push',
			'push',
			'add',
			'functionEnd',
		]);
	});

	test('reuses cached AST entries when recompiling unchanged source', () => {
		const source = `
8f4e/v1

entry main
module cachedModule
int value 1
moduleEnd
entryEnd

function cachedFunction
push 1
functionEnd int
`;
		const first = compileFixtureProgramSource(source);
		const cachedModuleAst = first.compileResult.cache.ast.entries.get('entry:main:module:0')?.ast;
		const cachedFunctionAst = first.compileResult.cache.ast.entries.get('function:0')?.ast;
		const second = compileFixtureProgramSource(source, {
			cache: first.compileResult.cache,
		});

		expect(second.compileResult.cache).toBe(first.compileResult.cache);
		expect(second.compileResult.cache.ast.entries.get('entry:main:module:0')?.ast).toBe(cachedModuleAst);
		expect(second.compileResult.cache.ast.entries.get('function:0')?.ast).toBe(cachedFunctionAst);
		expect(second.compileResult.cache.ast.stats.hits).toBeGreaterThanOrEqual(2);
	});
});
