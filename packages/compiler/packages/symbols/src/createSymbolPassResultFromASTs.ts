import { collectConstScopesByAst } from './collectConstScopesByAst';
import { collectSymbolNamespacesFromASTs } from './collectSymbolNamespacesFromASTs';

import type { AST } from '@8f4e/tokenizer';
import type { CompiledFunctionLookup, SymbolPassResult } from './types';

export function createSymbolPassResultFromASTs(
	asts: AST[],
	compiledFunctions?: CompiledFunctionLookup
): SymbolPassResult {
	const namespaceAsts = asts.filter(ast => {
		const firstInstruction = ast[0].instruction;
		return firstInstruction === 'module' || firstInstruction === 'constants';
	});
	const namespaces = collectSymbolNamespacesFromASTs(namespaceAsts, compiledFunctions);
	return {
		namespaces,
		constScopesByAst: collectConstScopesByAst(asts, namespaces, compiledFunctions),
	};
}
