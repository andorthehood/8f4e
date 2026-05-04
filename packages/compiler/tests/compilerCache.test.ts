import { describe, expect, test } from 'vitest';

import compile from '../src';

import type { Module } from '@8f4e/compiler-types';

const options = {
	startingMemoryWordAddress: 0,
	disableSharedMemory: true,
};

function moduleWithDefault(id: string, value: number): Module {
	return {
		code: [`module ${id}`, `int value ${value}`, 'moduleEnd'],
	};
}

function functionWithLiteral(value: number): Module {
	return {
		code: ['function literalValue', `push ${value}`, 'functionEnd int'],
	};
}

describe('compiler AST cache', () => {
	test('returns a cache and reuses unchanged module AST entries', () => {
		const first = compile([moduleWithDefault('first', 1), moduleWithDefault('second', 2)], options);
		const firstModuleAst = first.cache.ast.entries.get('module:0')?.ast;
		const secondModuleAst = first.cache.ast.entries.get('module:1')?.ast;

		const second = compile(
			[moduleWithDefault('first', 1), moduleWithDefault('second', 2)],
			options,
			undefined,
			undefined,
			first.cache
		);

		expect(second.cache).toBe(first.cache);
		expect(second.cache.ast.entries.get('module:0')?.ast).toBe(firstModuleAst);
		expect(second.cache.ast.entries.get('module:1')?.ast).toBe(secondModuleAst);
		expect(second.cache.ast.stats).toEqual({ hits: 2, misses: 2 });
	});

	test('reparses only changed module AST entries', () => {
		const first = compile([moduleWithDefault('first', 1), moduleWithDefault('second', 2)], options);
		const firstModuleAst = first.cache.ast.entries.get('module:0')?.ast;
		const secondModuleAst = first.cache.ast.entries.get('module:1')?.ast;

		const second = compile(
			[moduleWithDefault('first', 3), moduleWithDefault('second', 2)],
			options,
			undefined,
			undefined,
			first.cache
		);

		expect(second.cache.ast.entries.get('module:0')?.ast).not.toBe(firstModuleAst);
		expect(second.cache.ast.entries.get('module:1')?.ast).toBe(secondModuleAst);
		expect(second.cache.ast.stats).toEqual({ hits: 1, misses: 3 });
	});

	test('caches function AST entries separately from module AST entries', () => {
		const first = compile([moduleWithDefault('app', 0)], options, [functionWithLiteral(1)]);
		const moduleAst = first.cache.ast.entries.get('module:0')?.ast;
		const functionAst = first.cache.ast.entries.get('function:0')?.ast;

		const second = compile([moduleWithDefault('app', 0)], options, [functionWithLiteral(2)], undefined, first.cache);

		expect(second.cache.ast.entries.get('module:0')?.ast).toBe(moduleAst);
		expect(second.cache.ast.entries.get('function:0')?.ast).not.toBe(functionAst);
		expect(second.cache.ast.stats).toEqual({ hits: 1, misses: 3 });
	});

	test('hashes macro-expanded source and line metadata', () => {
		const modules: Module[] = [{ code: ['module app', 'macro declareValue', 'moduleEnd'] }];
		const macros: Module[] = [{ code: ['defineMacro declareValue', 'int value 1', 'defineMacroEnd'] }];
		const first = compile(modules, options, undefined, macros);
		const moduleAst = first.cache.ast.entries.get('module:0')?.ast;

		const second = compile(modules, options, undefined, macros, first.cache);
		const cachedAst = second.cache.ast.entries.get('module:0')?.ast;
		const macroExpandedLine = cachedAst?.find(line => line.instruction === 'int');

		expect(cachedAst).toBe(moduleAst);
		expect(macroExpandedLine?.lineNumberBeforeMacroExpansion).toBe(1);

		const changedMacros: Module[] = [{ code: ['defineMacro declareValue', 'int value 2', 'defineMacroEnd'] }];
		const third = compile(modules, options, undefined, changedMacros, first.cache);

		expect(third.cache.ast.entries.get('module:0')?.ast).not.toBe(moduleAst);
		expect(third.cache.ast.stats).toEqual({ hits: 1, misses: 2 });
	});

	test('produces equivalent output with and without a reused cache', () => {
		const modules = [moduleWithDefault('first', 1), moduleWithDefault('second', 2)];
		const first = compile(modules, options);
		const fresh = compile(modules, options);
		const cached = compile(modules, options, undefined, undefined, first.cache);

		expect(Array.from(cached.codeBuffer)).toEqual(Array.from(fresh.codeBuffer));
		expect(cached.requiredMemoryBytes).toBe(fresh.requiredMemoryBytes);
		expect(cached.compiledModules).toEqual(fresh.compiledModules);
	});
});
