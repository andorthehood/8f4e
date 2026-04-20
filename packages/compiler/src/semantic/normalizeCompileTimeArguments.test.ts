import { describe, expect, it } from 'vitest';
import { classifyIdentifier, parseArgument } from '@8f4e/tokenizer';

import normalizeCompileTimeArguments from './normalizeCompileTimeArguments';

import { type AST, type CompilationContext } from '../types';
import { ErrorCode } from '../compilerError';

describe('normalizeCompileTimeArguments', () => {
	it('throws for unresolved push compile-time expressions', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [parseArgument('2*MISSING')],
		};
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws for unresolved default identifiers', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'default',
			arguments: [classifyIdentifier('MISSING_CONST')],
		};
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws for unresolved map identifiers', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'map',
			arguments: [classifyIdentifier('MISSING_KEY'), classifyIdentifier('MISSING_VALUE')],
		};
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('keeps push local identifiers unchanged', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'push',
			arguments: [classifyIdentifier('localVar')],
		};
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
			locals: { localVar: { isInteger: true, index: 0 } },
		} as unknown as CompilationContext;

		expect(normalizeCompileTimeArguments(line, context)).toEqual(line);
	});

	it('throws for undeclared localSet targets', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'localSet',
			arguments: [classifyIdentifier('missing')],
		};
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {} },
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDECLARED_IDENTIFIER}`);
	});

	it('throws for undeclared call targets when the function registry is available', () => {
		const line: AST[number] = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'call',
			arguments: [classifyIdentifier('missingFn')],
		};
		const context = {
			namespace: { memory: {}, consts: {}, moduleName: 'test', namespaces: {}, functions: {} },
			locals: {},
		} as unknown as CompilationContext;

		expect(() => normalizeCompileTimeArguments(line, context)).toThrow(`${ErrorCode.UNDEFINED_FUNCTION}`);
	});
});
