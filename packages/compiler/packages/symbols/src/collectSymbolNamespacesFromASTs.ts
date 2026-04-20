import { shouldDeferNamespaceCollection } from './internal/shouldDeferNamespaceCollection';
import { prepassSymbolNamespace } from './prepassSymbolNamespace';

import type { AST } from '@8f4e/tokenizer';
import type { CollectedNamespace, CompiledFunctionLookup, Namespaces } from './types';

export function collectSymbolNamespacesFromASTs(asts: AST[], compiledFunctions?: CompiledFunctionLookup): Namespaces {
	const namespaces: Namespaces = {};

	let pendingAsts = [...asts];
	let madeProgress = true;

	while (pendingAsts.length > 0 && madeProgress) {
		madeProgress = false;
		const deferredAsts: AST[] = [];

		for (const ast of pendingAsts) {
			try {
				const context = prepassSymbolNamespace(ast, namespaces, compiledFunctions);
				const firstInstruction = ast[0].instruction;
				const kind: CollectedNamespace['kind'] = firstInstruction === 'module' ? 'module' : 'constants';
				namespaces[context.namespace.moduleName as string] = {
					kind,
					consts: { ...context.namespace.consts },
				};
				madeProgress = true;
			} catch (error) {
				if (shouldDeferNamespaceCollection(error as { code: number; line: AST[number] }, namespaces)) {
					deferredAsts.push(ast);
					continue;
				}
				throw error;
			}
		}

		pendingAsts = deferredAsts;
	}

	if (pendingAsts.length > 0) {
		prepassSymbolNamespace(pendingAsts[0], namespaces, compiledFunctions);
	}

	return namespaces;
}
