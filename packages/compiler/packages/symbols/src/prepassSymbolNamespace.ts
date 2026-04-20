import { normalizeConst } from './internal/normalizeConst';
import { semanticConst } from './internal/semanticConst';
import { semanticConstants } from './internal/semanticConstants';
import { semanticConstantsEnd } from './internal/semanticConstantsEnd';
import { semanticModule } from './internal/semanticModule';
import { semanticModuleEnd } from './internal/semanticModuleEnd';
import { semanticUse } from './internal/semanticUse';

import type { CompiledFunctionLookup, Namespaces, SymbolResolutionContext } from './types';
import type {
	AST,
	ConstLine,
	ConstantsEndLine,
	ConstantsLine,
	ModuleEndLine,
	ModuleLine,
	UseLine,
} from '@8f4e/tokenizer';

export function prepassSymbolNamespace(
	ast: AST,
	namespaces: Namespaces,
	functions?: CompiledFunctionLookup
): SymbolResolutionContext {
	const firstLine = ast[0];
	const context: SymbolResolutionContext = {
		namespace: {
			namespaces,
			consts: {},
			moduleName: undefined,
			functions,
		},
		blockStack: [],
		codeBlockType: firstLine.instruction === 'constants' ? 'constants' : 'module',
	};

	for (const line of ast) {
		if (!line.isSemanticOnly) {
			continue;
		}

		switch (line.instruction) {
			case 'const':
				semanticConst(normalizeConst(line as ConstLine, context), context);
				break;
			case 'use':
				semanticUse(line as UseLine, context);
				break;
			case 'module':
				semanticModule(line as ModuleLine, context);
				break;
			case 'moduleEnd':
				semanticModuleEnd(line as ModuleEndLine, context);
				break;
			case 'constants':
				semanticConstants(line as ConstantsLine, context);
				break;
			case 'constantsEnd':
				semanticConstantsEnd(line as ConstantsEndLine, context);
				break;
		}
	}

	return context;
}
