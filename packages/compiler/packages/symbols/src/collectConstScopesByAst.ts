import { ArgumentType, type AST } from '@8f4e/tokenizer';

import { normalizeConst } from './internal/normalizeConst';
import { semanticConst } from './internal/semanticConst';
import { semanticConstants } from './internal/semanticConstants';
import { semanticConstantsEnd } from './internal/semanticConstantsEnd';
import { semanticModule } from './internal/semanticModule';
import { semanticModuleEnd } from './internal/semanticModuleEnd';
import { semanticUse } from './internal/semanticUse';
import {
	BLOCK_TYPE,
	type CompiledFunctionLookup,
	type Consts,
	type Namespaces,
	type SymbolResolutionContext,
} from './types';

function applySymbolSemanticLine(line: AST[number], context: SymbolResolutionContext): void {
	switch (line.instruction) {
		case 'const':
			semanticConst(normalizeConst(line as Parameters<typeof normalizeConst>[0], context), context);
			return;
		case 'use':
			semanticUse(line as Parameters<typeof semanticUse>[0], context);
			return;
		case 'module':
			semanticModule(line as Parameters<typeof semanticModule>[0], context);
			return;
		case 'moduleEnd':
			semanticModuleEnd(line as Parameters<typeof semanticModuleEnd>[0], context);
			return;
		case 'constants':
			semanticConstants(line as Parameters<typeof semanticConstants>[0], context);
			return;
		case 'constantsEnd':
			semanticConstantsEnd(line as Parameters<typeof semanticConstantsEnd>[0], context);
			return;
		case 'function':
			context.blockStack.push({
				hasExpectedResult: false,
				expectedResultIsInteger: false,
				blockType: BLOCK_TYPE.FUNCTION,
			});
			context.codeBlockId = (line.arguments[0] as { type: ArgumentType.IDENTIFIER; value: string }).value;
			context.codeBlockType = 'function';
			return;
		case 'functionEnd': {
			const block = context.blockStack.pop();
			if (!block || block.blockType !== BLOCK_TYPE.FUNCTION) {
				context.blockStack = [];
			}
		}
	}
}

export function collectConstScopesByAst(
	asts: AST[],
	namespaces: Namespaces,
	functions?: CompiledFunctionLookup
): ReadonlyMap<AST, ReadonlyArray<Consts>> {
	const constScopesByAst = new Map<AST, ReadonlyArray<Consts>>();

	for (const ast of asts) {
		const firstInstruction = ast[0].instruction;
		const context: SymbolResolutionContext = {
			namespace: {
				namespaces,
				consts: {},
				moduleName: undefined,
				functions,
			},
			blockStack: [],
			codeBlockType:
				firstInstruction === 'constants' ? 'constants' : firstInstruction === 'function' ? 'function' : 'module',
		};

		const scopesForAst: Consts[] = [];

		for (const line of ast) {
			scopesForAst.push({ ...context.namespace.consts });

			if (line.isSemanticOnly || line.instruction === 'function' || line.instruction === 'functionEnd') {
				applySymbolSemanticLine(line, context);
			}
		}

		constScopesByAst.set(ast, scopesForAst);
	}

	return constScopesByAst;
}
