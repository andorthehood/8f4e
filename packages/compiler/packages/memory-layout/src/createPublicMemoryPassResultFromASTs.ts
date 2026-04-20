import { type AST, type ModuleLine } from '@8f4e/tokenizer';
import { createSymbolPassResultFromASTs, type SymbolPassResult } from '@8f4e/compiler-symbols';

import { discoverPublicMemoryModulesFromASTs } from './discoverPublicMemoryModulesFromASTs';
import { planPublicMemoryNamespace } from './planPublicMemoryNamespace';
import { GLOBAL_ALIGNMENT_BOUNDARY, type CompiledFunctionLookup } from './internalTypes';
import { type PublicMemoryPlan, type PublicMemoryPassResult } from './types';

export interface CreatePublicMemoryPassResultFromASTsOptions {
	startingByteAddress?: number;
	compiledFunctions?: CompiledFunctionLookup;
	layoutAsts?: AST[];
	symbolPassResult?: SymbolPassResult;
}

export function createPublicMemoryPassResultFromASTs(
	asts: AST[],
	options: CreatePublicMemoryPassResultFromASTsOptions = {}
): PublicMemoryPassResult {
	const startingByteAddress = options.startingByteAddress ?? GLOBAL_ALIGNMENT_BOUNDARY;
	const compiledFunctions = options.compiledFunctions;
	const layoutAsts = options.layoutAsts ?? asts;
	const symbolPassResult = options.symbolPassResult ?? createSymbolPassResultFromASTs(asts, compiledFunctions);
	const namespaces = symbolPassResult.namespaces;
	const discoveredModules = discoverPublicMemoryModulesFromASTs(layoutAsts, { symbolPassResult });
	const modules: PublicMemoryPassResult['modules'] = {};
	const modulePlans: Record<string, PublicMemoryPlan> = {};

	let nextStartingByteAddress = startingByteAddress;
	for (const ast of layoutAsts) {
		const firstLine = ast[0];
		const isModuleAst = firstLine.instruction === 'module';
		const plan = planPublicMemoryNamespace(
			ast,
			namespaces,
			modules,
			nextStartingByteAddress,
			compiledFunctions,
			discoveredModules
		);
		if (!isModuleAst) {
			continue;
		}
		const moduleName = (firstLine as ModuleLine).arguments[0].value;

		modulePlans[moduleName] = plan;
		modules[moduleName] = {
			byteAddress: nextStartingByteAddress,
			wordAlignedSize: plan.currentModuleWordAlignedSize,
			memory: plan.memory,
		};

		nextStartingByteAddress += plan.currentModuleWordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY;
	}

	return {
		modules,
		modulePlans,
		requiredPublicMemoryBytes: nextStartingByteAddress,
	};
}
