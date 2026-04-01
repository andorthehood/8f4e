import { ArgumentType } from './types';
import { isMemoryDeclarationInstruction } from './semantic/declarations';

import type { AST, Argument } from './types';

function getIntermodularReferenceModules(argument: Argument | undefined): string[] {
	if (!argument) {
		return [];
	}

	if (argument.type === ArgumentType.COMPILE_TIME_EXPRESSION) {
		return [...argument.intermoduleIds];
	}

	if (argument.type !== ArgumentType.IDENTIFIER) {
		return [];
	}

	if (argument.scope === 'intermodule' && argument.targetModuleId) {
		return [argument.targetModuleId];
	}

	return [];
}

function getIdentifierValue(argument: Argument | undefined): string {
	return argument?.type === ArgumentType.IDENTIFIER ? argument.value : '';
}

interface ModuleSortMetadata {
	ast: AST;
	moduleId: string;
	isConstantsBlock: boolean;
	referencedModuleIds: string[];
	index: number;
}

function extractIntermodularDependencies(ast: AST): string[] {
	return ast
		.filter(({ instruction }) => isMemoryDeclarationInstruction(instruction))
		.flatMap(({ arguments: args }) => args.flatMap(arg => getIntermodularReferenceModules(arg)));
}

function getModuleSortMetadata(ast: AST, index: number): ModuleSortMetadata {
	const isConstantsBlock = ast.some(line => line.instruction === 'constants');
	const moduleId = getIdentifierValue(ast.find(line => line.instruction === 'module')?.arguments[0]);
	const referencedModuleIds = isConstantsBlock ? [] : extractIntermodularDependencies(ast);
	return { ast, moduleId, isConstantsBlock, referencedModuleIds, index };
}

export default function sortModules(modules: AST[]): AST[] {
	const metadata = modules.map((ast, index) => getModuleSortMetadata(ast, index));

	const constantsBlocks = metadata.filter(m => m.isConstantsBlock).map(m => m.ast);
	const regularMetadata = metadata.filter(m => !m.isConstantsBlock);

	// Build moduleId → modules lookup (handles duplicate module IDs)
	const modulesByIdMap = new Map<string, ModuleSortMetadata[]>();
	for (const m of regularMetadata) {
		const bucket = modulesByIdMap.get(m.moduleId) ?? [];
		bucket.push(m);
		modulesByIdMap.set(m.moduleId, bucket);
	}

	// DFS topological sort: referenced (dependency) modules are emitted before
	// the modules that reference them. `visited` uses the unique `index` field
	// so duplicate module IDs are handled correctly.
	const visited = new Set<number>();
	const sorted: ModuleSortMetadata[] = [];

	function visit(m: ModuleSortMetadata): void {
		if (visited.has(m.index)) return;
		visited.add(m.index);
		for (const depId of m.referencedModuleIds) {
			for (const dep of modulesByIdMap.get(depId) ?? []) {
				visit(dep);
			}
		}
		sorted.push(m);
	}

	// Iterate in alphabetical order so independent modules appear deterministically
	const alphabeticalOrder = [...regularMetadata].sort((a, b) => {
		if (a.moduleId < b.moduleId) return -1;
		if (a.moduleId > b.moduleId) return 1;
		return a.index - b.index;
	});

	for (const m of alphabeticalOrder) {
		visit(m);
	}

	return [...constantsBlocks, ...sorted.map(m => m.ast)];
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
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
				op.type === ArgumentType.IDENTIFIER && op.scope === 'intermodule' && op.targetModuleId
					? [op.targetModuleId]
					: []
			),
		};
	};

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
