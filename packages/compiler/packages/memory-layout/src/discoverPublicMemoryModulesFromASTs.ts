import { ArgumentType, type AST, type ConstantsLine, type ModuleLine } from '@8f4e/tokenizer';
import { createSymbolPassResultFromASTs, type SymbolPassResult } from '@8f4e/compiler-symbols';

import { type DiscoveredModuleLayouts } from './types';

export interface DiscoverPublicMemoryModulesFromASTsOptions {
	symbolPassResult?: SymbolPassResult;
}

export function discoverPublicMemoryModulesFromASTs(
	asts: AST[],
	options: DiscoverPublicMemoryModulesFromASTsOptions = {}
): DiscoveredModuleLayouts {
	const symbolPassResult = options.symbolPassResult ?? createSymbolPassResultFromASTs(asts);
	const discoveredModules: DiscoveredModuleLayouts = {};

	for (const ast of asts) {
		const normalizedAst = symbolPassResult.normalizedAstsByAst.get(ast) ?? ast;
		const firstLine = normalizedAst[0] as ModuleLine | ConstantsLine;
		const kind = firstLine.instruction === 'module' ? 'module' : 'constants';
		const moduleName = firstLine.arguments[0].value;
		const memoryIds: Record<string, true> = {};

		for (const line of normalizedAst) {
			if (!line.isMemoryDeclaration) {
				continue;
			}

			const idArgument = line.arguments[0];
			if (idArgument?.type === ArgumentType.IDENTIFIER) {
				memoryIds[idArgument.value] = true;
			}
		}

		discoveredModules[moduleName] = {
			kind,
			memoryIds,
		};
	}

	return discoveredModules;
}
