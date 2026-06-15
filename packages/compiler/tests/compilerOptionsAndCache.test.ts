import { ArgumentType, createFunctionId } from '@8f4e/compiler-spec';
import { describe, expect, test } from 'vitest';

import { compileFixtureProgramSource } from './testUtils';

describe('compiler options and cache', () => {
	test('always exposes AST and exposes stack analysis only when requested', async () => {
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
		const defaultResult = (await compileFixtureProgramSource(source)).compileResult;
		const analyzedResult = (
			await compileFixtureProgramSource(source, {
				includeStackAnalysis: true,
			})
		).compileResult;
		const functionId = createFunctionId('double', ['int']);

		expect(defaultResult.compiledModules.optionSurface.ast.id).toBe('optionSurface');
		expect(defaultResult.compiledModules.optionSurface.stackAnalysis).toBeUndefined();
		expect(defaultResult.compiledFunctions![functionId].stackAnalysis).toBeUndefined();

		expect(analyzedResult.compiledModules.optionSurface.ast.id).toBe('optionSurface');
		expect(analyzedResult.compiledModules.optionSurface.stackAnalysis?.map(line => line.instruction)).toEqual([
			'push',
			'push',
			'store',
		]);
		expect(analyzedResult.compiledFunctions![functionId].stackAnalysis?.map(line => line.instruction)).toEqual([
			'function',
			'param',
			'push',
			'push',
			'add',
			'functionEnd',
		]);
	});

	test('reuses cached AST entries when recompiling unchanged source', async () => {
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
		const first = await compileFixtureProgramSource(source);
		const cachedModuleAst = first.compileResult.cache.ast.entries.get('entry:main:module:0')?.ast;
		const cachedFunctionAst = first.compileResult.cache.ast.entries.get('function:0')?.ast;
		const second = await compileFixtureProgramSource(source, {
			cache: first.compileResult.cache,
		});

		expect(second.compileResult.cache).toBe(first.compileResult.cache);
		expect(second.compileResult.cache.ast.entries.get('entry:main:module:0')?.ast).toBe(cachedModuleAst);
		expect(second.compileResult.cache.ast.entries.get('function:0')?.ast).toBe(cachedFunctionAst);
		expect(second.compileResult.cache.ast.stats.hits).toBeGreaterThanOrEqual(2);
	});

	test('reuses cached AST entries without preserving stale inlined constants', async () => {
		const sourceWithSize = (size: number) => `
8f4e/v1

constants env
const SIZE ${size}
constantsEnd

entry main
module cachedModule
use env
int[] buffer SIZE
moduleEnd
entryEnd
`;
		const first = await compileFixtureProgramSource(sourceWithSize(2));
		const cachedModuleAst = first.compileResult.cache.ast.entries.get('entry:main:module:0')?.ast;
		const cachedBufferLine = cachedModuleAst?.lines.find(line => line.instruction === 'int[]');

		expect(first.compileResult.compiledModules.cachedModule.memoryMap.buffer.numberOfElements).toBe(2);
		expect(cachedBufferLine?.arguments[1]).toMatchObject({
			type: ArgumentType.IDENTIFIER,
			value: 'SIZE',
			referenceKind: 'constant',
		});

		const second = await compileFixtureProgramSource(sourceWithSize(4), {
			cache: first.compileResult.cache,
		});

		expect(second.compileResult.cache.ast.entries.get('entry:main:module:0')?.ast).toBe(cachedModuleAst);
		expect(second.compileResult.compiledModules.cachedModule.memoryMap.buffer.numberOfElements).toBe(4);
		expect(cachedBufferLine?.arguments[1]).toMatchObject({
			type: ArgumentType.IDENTIFIER,
			value: 'SIZE',
			referenceKind: 'constant',
		});
		expect(second.compileResult.cache.ast.stats.hits).toBeGreaterThanOrEqual(1);
	});
});
