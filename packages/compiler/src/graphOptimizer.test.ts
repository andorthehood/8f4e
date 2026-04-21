import { describe, expect, it } from 'vitest';

import { ErrorCode } from './compilerError';
import sortModules, { getIdentifierValue } from './graphOptimizer';
import { ArgumentType } from './types';

import type { AST } from './types';

const { classifyIdentifier, parseCompileTimeOperand } = await import('@8f4e/tokenizer');

const identifierArgument = (value: string) => classifyIdentifier(value);

const compileTimeExpressionArgument = (lhs: string, operator: '*' | '/', rhs: string) => {
	const left = parseCompileTimeOperand(lhs);
	const right = parseCompileTimeOperand(rhs);
	return {
		type: ArgumentType.COMPILE_TIME_EXPRESSION,
		left,
		operator,
		right,
		intermoduleIds: [left, right].flatMap(op =>
			op.type === ArgumentType.IDENTIFIER && op.scope === 'intermodule' && op.targetModuleId ? [op.targetModuleId] : []
		),
	};
};

const createModuleAst = (moduleId: string, references: string[] = [], followTargetModuleId?: string): AST => {
	return [
		{
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'module',
			arguments: [identifierArgument(moduleId)],
			isSemanticOnly: true,
		},
		...(followTargetModuleId
			? [
					{
						lineNumberBeforeMacroExpansion: 2,
						lineNumberAfterMacroExpansion: 2,
						instruction: '#follow',
						arguments: [identifierArgument(followTargetModuleId)],
						isSemanticOnly: true,
					},
				]
			: []),
		...references.map((reference, index) => {
			return {
				lineNumberBeforeMacroExpansion: index + (followTargetModuleId ? 3 : 2),
				lineNumberAfterMacroExpansion: index + (followTargetModuleId ? 3 : 2),
				instruction: 'int',
				arguments: [identifierArgument(`value${index}`), identifierArgument(reference)],
			};
		}),
	] as AST;
};

const createConstantsAst = (): AST => {
	return [
		{
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'constants',
			arguments: [],
			isSemanticOnly: true,
		},
	] as AST;
};

const getModuleId = (ast: AST): string => {
	const moduleLine = ast.find(line => line.instruction === 'module');
	return getIdentifierValue(moduleLine?.arguments[0]) || 'constants';
};

describe('sortModules', () => {
	it('puts constants blocks first and sorts independent modules by module id', () => {
		const constants = createConstantsAst();
		const beta = createModuleAst('beta');
		const alpha = createModuleAst('alpha');

		const sorted = sortModules([beta, constants, alpha]);

		expect(sorted.map(getModuleId)).toEqual(['constants', 'alpha', 'beta']);
	});

	it('handles all supported intermodular reference syntaxes', () => {
		const alpha = createModuleAst('alpha');
		const beta = createModuleAst('beta', [
			'count(alpha:value)',
			'sizeof(alpha:value)',
			'max(alpha:value)',
			'min(alpha:value)',
			'&alpha:value',
			'alpha:value&',
			'&alpha:',
			'alpha:&',
		]);

		const sorted = sortModules([beta, alpha]);

		expect(sorted.map(getModuleId)).toEqual(['alpha', 'beta']);
	});

	it('orders referenced module before the module that references it', () => {
		const alpha = createModuleAst('alpha', ['&beta:value']);
		const beta = createModuleAst('beta');

		const sorted = sortModules([alpha, beta]);

		expect(sorted.map(getModuleId)).toEqual(['beta', 'alpha']);
	});

	it('orders referenced module before the module that references it inside a compile-time expression', () => {
		const alpha: AST = [
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'module',
				arguments: [identifierArgument('alpha')],
				isSemanticOnly: true,
			},
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'int',
				arguments: [identifierArgument('size'), compileTimeExpressionArgument('2', '*', 'sizeof(beta:value)')],
			},
		] as AST;
		const beta = createModuleAst('beta');

		const sorted = sortModules([alpha, beta]);

		expect(sorted.map(getModuleId)).toEqual(['beta', 'alpha']);
	});

	it('ignores non-memory-declaration instructions when detecting dependencies', () => {
		// alpha has a memory declaration referencing zeta (real dependency: zeta must come first)
		const alpha: AST = [
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'module',
				arguments: [identifierArgument('alpha')],
				isSemanticOnly: true,
			},
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'int',
				arguments: [identifierArgument('x'), identifierArgument('&zeta:value')],
			},
		] as AST;
		// zeta has a runtime instruction referencing alpha (must NOT create a layout dependency)
		// If it did, alpha→zeta and zeta→alpha would form a cycle, and alphabetical order
		// would incorrectly place alpha before zeta.
		const zeta: AST = [
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'module',
				arguments: [identifierArgument('zeta')],
				isSemanticOnly: true,
			},
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'push',
				arguments: [identifierArgument('&alpha:value')],
			},
		] as AST;

		const sorted = sortModules([alpha, zeta]);

		// zeta must come first: alpha's memory declaration references it, so zeta's byteAddress
		// must be resolved before alpha is laid out. zeta's push of &alpha: is a runtime
		// instruction and must not create a false reverse dependency.
		expect(sorted.map(getModuleId)).toEqual(['zeta', 'alpha']);
	});

	it('keeps follow chains contiguous with no module in between', () => {
		const alpha = createModuleAst('alpha');
		const beta = createModuleAst('beta', [], 'alpha');
		const gamma = createModuleAst('gamma');

		const sorted = sortModules([gamma, beta, alpha]);

		expect(sorted.map(getModuleId)).toEqual(['alpha', 'beta', 'gamma']);
	});

	it('supports multi-module follow chains as a contiguous segment', () => {
		const alpha = createModuleAst('alpha');
		const beta = createModuleAst('beta', [], 'alpha');
		const gamma = createModuleAst('gamma', [], 'beta');
		const delta = createModuleAst('delta');

		const sorted = sortModules([delta, gamma, beta, alpha]);

		expect(sorted.map(getModuleId)).toEqual(['alpha', 'beta', 'gamma', 'delta']);
	});

	it('rejects #follow when the target module does not exist', () => {
		const alpha = createModuleAst('alpha', [], 'missing');

		expect(() => sortModules([alpha])).toThrow(`${ErrorCode.MODULE_FOLLOW_TARGET_NOT_FOUND}`);
	});

	it('rejects self-following modules', () => {
		const alpha = createModuleAst('alpha', [], 'alpha');

		expect(() => sortModules([alpha])).toThrow(`${ErrorCode.MODULE_FOLLOW_SELF}`);
	});

	it('rejects multiple modules following the same target', () => {
		const alpha = createModuleAst('alpha');
		const beta = createModuleAst('beta', [], 'alpha');
		const gamma = createModuleAst('gamma', [], 'alpha');

		expect(() => sortModules([alpha, beta, gamma])).toThrow(`${ErrorCode.MODULE_FOLLOW_DUPLICATE_FOLLOWER}`);
	});

	it('rejects cycles in follow constraints', () => {
		const alpha = createModuleAst('alpha', [], 'beta');
		const beta = createModuleAst('beta', [], 'alpha');

		expect(() => sortModules([alpha, beta])).toThrow(`${ErrorCode.MODULE_FOLLOW_CYCLE}`);
	});

	it('rejects follow chains that conflict with dependency ordering', () => {
		const alpha = createModuleAst('alpha', ['&gamma:value']);
		const beta = createModuleAst('beta', [], 'alpha');
		const gamma = createModuleAst('gamma', [], 'beta');

		expect(() => sortModules([alpha, beta, gamma])).toThrow(`${ErrorCode.MODULE_FOLLOW_DEPENDENCY_CONFLICT}`);
	});
});
