import { ArgumentType } from '@8f4e/compiler-types';

import { isMemoryDeclarationInstruction } from './semantic/declarations';

import type { AST, Argument } from '@8f4e/compiler-types';

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

export function getIdentifierValue(argument: Argument | undefined): string {
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

	const modulesByIdMap = new Map<string, ModuleSortMetadata>();
	for (const m of regularMetadata) {
		modulesByIdMap.set(m.moduleId, m);
	}

	// DFS topological sort: referenced (dependency) modules are emitted before
	// the modules that reference them.
	const visited = new Set<string>();
	const sorted: ModuleSortMetadata[] = [];

	function visit(m: ModuleSortMetadata): void {
		if (visited.has(m.moduleId)) return;
		visited.add(m.moduleId);
		for (const depId of m.referencedModuleIds) {
			const dep = modulesByIdMap.get(depId);
			if (dep) {
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
