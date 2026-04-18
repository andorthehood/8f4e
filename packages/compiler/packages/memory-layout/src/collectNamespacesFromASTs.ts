import { getError } from './getError';
import { shouldDeferNamespaceCollection } from './internal/shouldDeferNamespaceCollection';
import { toNamespaceDiscoveryAst } from './internal/toNamespaceDiscoveryAst';
import { prepassNamespace } from './prepassNamespace';
import { ErrorCode, GLOBAL_ALIGNMENT_BOUNDARY, type CompiledFunctionLookup, type Namespaces } from './types';

import type { AST } from '@8f4e/tokenizer';

export function collectNamespacesFromASTs(
	asts: AST[],
	startingByteAddress = GLOBAL_ALIGNMENT_BOUNDARY,
	compiledFunctions?: CompiledFunctionLookup,
	layoutAsts: AST[] = asts
): Namespaces {
	const namespaces: Namespaces = {};

	let pendingAsts = [...asts];
	let madeProgress = true;

	while (pendingAsts.length > 0 && madeProgress) {
		madeProgress = false;
		const deferredAsts: AST[] = [];

		for (const ast of pendingAsts) {
			try {
				const context = prepassNamespace(
					toNamespaceDiscoveryAst(ast),
					namespaces,
					startingByteAddress,
					compiledFunctions
				);
				if (!context.namespace.moduleName) {
					continue;
				}
				const moduleLine = ast.find(line => line.instruction === 'module');
				const existingNamespace = namespaces[context.namespace.moduleName];
				if (moduleLine && existingNamespace?.kind === 'module') {
					throw getError(ErrorCode.DUPLICATE_IDENTIFIER, moduleLine ?? ast[0], context, {
						identifier: context.namespace.moduleName,
					});
				}
				namespaces[context.namespace.moduleName] = {
					kind: moduleLine ? 'module' : 'constants',
					consts: { ...context.namespace.consts },
					memory: context.namespace.memory,
				};
				madeProgress = true;
			} catch (error) {
				const failingLine =
					typeof error === 'object' && error !== null && 'line' in error ? (error.line as AST[number]) : undefined;
				if (shouldDeferNamespaceCollection(error, failingLine, namespaces)) {
					deferredAsts.push(ast);
					continue;
				}
				throw error;
			}
		}

		pendingAsts = deferredAsts;
	}

	if (pendingAsts.length > 0) {
		prepassNamespace(pendingAsts[0], namespaces, startingByteAddress, compiledFunctions);
	}

	let nextStartingByteAddress = startingByteAddress;
	for (const ast of layoutAsts) {
		const context = prepassNamespace(ast, namespaces, nextStartingByteAddress, compiledFunctions);
		if (!context.namespace.moduleName) {
			continue;
		}

		namespaces[context.namespace.moduleName] = {
			kind: 'module',
			consts: { ...context.namespace.consts },
			memory: context.namespace.memory,
			byteAddress: nextStartingByteAddress,
			wordAlignedSize: context.currentModuleWordAlignedSize ?? 0,
		};

		nextStartingByteAddress += (context.currentModuleWordAlignedSize ?? 0) * GLOBAL_ALIGNMENT_BOUNDARY;
	}

	return namespaces;
}
