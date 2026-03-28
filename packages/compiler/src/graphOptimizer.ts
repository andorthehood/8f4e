import { isIntermodularReference } from '@8f4e/tokenizer';
import { isIntermodularModuleReference } from '@8f4e/tokenizer';
import { extractIntermodularModuleReferenceBase } from '@8f4e/tokenizer';
import { isIntermodularElementCountReference } from '@8f4e/tokenizer';
import { extractIntermodularElementCountBase } from '@8f4e/tokenizer';
import { isIntermodularElementWordSizeReference } from '@8f4e/tokenizer';
import { extractIntermodularElementWordSizeBase } from '@8f4e/tokenizer';
import { isIntermodularElementMaxReference } from '@8f4e/tokenizer';
import { extractIntermodularElementMaxBase } from '@8f4e/tokenizer';
import { isIntermodularElementMinReference } from '@8f4e/tokenizer';
import { extractIntermodularElementMinBase } from '@8f4e/tokenizer';

import { ArgumentType } from './types';

import type { AST, Argument } from './types';

function getIntermodularReferenceModules(argument: Argument | undefined): string[] {
	if (!argument) {
		return [];
	}

	const values =
		argument.type === ArgumentType.COMPILE_TIME_EXPRESSION ? [argument.lhs, argument.rhs] : [argument.value as string];

	return values.flatMap(value => {
		if (typeof value !== 'string') {
			return [];
		}

		if (isIntermodularElementCountReference(value)) {
			return [extractIntermodularElementCountBase(value).module];
		}
		if (isIntermodularElementWordSizeReference(value)) {
			return [extractIntermodularElementWordSizeBase(value).module];
		}
		if (isIntermodularElementMaxReference(value)) {
			return [extractIntermodularElementMaxBase(value).module];
		}
		if (isIntermodularElementMinReference(value)) {
			return [extractIntermodularElementMinBase(value).module];
		}
		if (isIntermodularModuleReference(value)) {
			return [extractIntermodularModuleReferenceBase(value).module];
		}
		if (isIntermodularReference(value)) {
			const cleanRef = value.endsWith('&') ? value.substring(0, value.length - 1) : value.substring(1);
			return [cleanRef.split(':')[0]];
		}

		return [];
	});
}

function getIdentifierValue(argument: Argument | undefined): string {
	return argument?.type === ArgumentType.IDENTIFIER ? argument.value : '';
}

export default function sortModules(modules: AST[]): AST[] {
	// First, separate constants blocks from regular modules
	const constantsBlocks = modules.filter(ast => ast.some(line => line.instruction === 'constants'));
	const regularModules = modules.filter(ast => !ast.some(line => line.instruction === 'constants'));

	// Sort regular modules by ID and dependencies
	const sortedRegularModules = regularModules
		.sort((astA, astB) => {
			const moduleIdA = getIdentifierValue(
				astA.find(({ instruction }) => {
					return instruction === 'module';
				})?.arguments[0]
			);
			const moduleIdB = getIdentifierValue(
				astB.find(({ instruction }) => {
					return instruction === 'module';
				})?.arguments[0]
			);

			if (moduleIdA < moduleIdB) {
				return -1;
			}
			if (moduleIdA > moduleIdB) {
				return 1;
			}
			return 0;
		})
		.sort((astA, astB) => {
			const moduleIdA = getIdentifierValue(
				astA.find(({ instruction }) => {
					return instruction === 'module';
				})?.arguments[0]
			);
			const moduleIdB = getIdentifierValue(
				astB.find(({ instruction }) => {
					return instruction === 'module';
				})?.arguments[0]
			);

			const intermodulerConnectionsA = astA
				.filter(({ instruction, arguments: _arguments }) => {
					return (
						['int*', 'int**', 'float*', 'float**', 'float64', 'float64*', 'float64**', 'init', 'int', 'float'].includes(
							instruction
						) &&
						_arguments[0] &&
						_arguments[1] &&
						_arguments[0].type === ArgumentType.IDENTIFIER &&
						getIntermodularReferenceModules(_arguments[1]).length > 0
					);
				})
				.flatMap(({ arguments: _arguments }) => getIntermodularReferenceModules(_arguments[1]));

			const intermodulerConnectionsB = astB
				.filter(({ instruction, arguments: _arguments }) => {
					return (
						['int*', 'int**', 'float*', 'float**', 'float64', 'float64*', 'float64**', 'init', 'int', 'float'].includes(
							instruction
						) &&
						_arguments[0] &&
						_arguments[1] &&
						_arguments[0].type === ArgumentType.IDENTIFIER &&
						getIntermodularReferenceModules(_arguments[1]).length > 0
					);
				})
				.flatMap(({ arguments: _arguments }) => getIntermodularReferenceModules(_arguments[1]));

			if (intermodulerConnectionsB.includes(moduleIdA) && !intermodulerConnectionsA.includes(moduleIdB)) {
				return 1;
			} else if (!intermodulerConnectionsB.includes(moduleIdA) && intermodulerConnectionsA.includes(moduleIdB)) {
				return -1;
			} else {
				return 0;
			}
		});

	// Return constants blocks first, then sorted regular modules
	return [...constantsBlocks, ...sortedRegularModules];
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const identifierArgument = (value: string) => ({
		type: ArgumentType.IDENTIFIER,
		value,
	});

	const compileTimeExpressionArgument = (lhs: string, operator: '*' | '/', rhs: string) => ({
		type: ArgumentType.COMPILE_TIME_EXPRESSION,
		lhs,
		operator,
		rhs,
	});

	const createModuleAst = (moduleId: string, references: string[] = []): AST => {
		return [
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'module',
				arguments: [identifierArgument(moduleId)],
				isSemanticOnly: true,
			},
			...references.map((reference, index) => {
				return {
					lineNumberBeforeMacroExpansion: index + 2,
					lineNumberAfterMacroExpansion: index + 2,
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

			expect(sorted.map(getModuleId)).toEqual(['beta', 'alpha']);
		});

		it('orders module before another module that references it', () => {
			const alpha = createModuleAst('alpha', ['&beta:value']);
			const beta = createModuleAst('beta');

			const sorted = sortModules([alpha, beta]);

			expect(sorted.map(getModuleId)).toEqual(['alpha', 'beta']);
		});

		it('orders module before another module that references it inside a compile-time expression', () => {
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

			expect(sorted.map(getModuleId)).toEqual(['alpha', 'beta']);
		});

		it('handles duplicate module ids deterministically', () => {
			const first = createModuleAst('same');
			const second = createModuleAst('same');

			const sorted = sortModules([first, second]);

			expect(sorted).toHaveLength(2);
			expect(sorted[0]).toBe(first);
			expect(sorted[1]).toBe(second);
		});
	});
}
