import { compilerSourceBlockInstructionByType } from '@8f4e/compiler-spec';

import type { CompiledModuleAST } from '@8f4e/compiler-spec';

const constantsBlockType = compilerSourceBlockInstructionByType.constants.type;

interface ModuleSortMetadata {
	ast: CompiledModuleAST;
	moduleId: string;
	isConstantsBlock: boolean;
	referencedModuleIds: string[];
	index: number;
}

function getModuleSortMetadata(ast: CompiledModuleAST, index: number): ModuleSortMetadata {
	const isConstantsBlock = ast.type === constantsBlockType;
	const referencedModuleIds = ast.type === 'module' ? [...ast.referencedModuleIds] : [];
	return { ast, moduleId: ast.id, isConstantsBlock, referencedModuleIds, index };
}

export default function sortModules(modules: CompiledModuleAST[]): CompiledModuleAST[] {
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
