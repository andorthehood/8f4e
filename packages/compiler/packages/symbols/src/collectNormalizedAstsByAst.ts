import { ArgumentType, type AST } from '@8f4e/tokenizer';

import { normalizeConst } from './internal/normalizeConst';
import { normalizeArgumentsAtIndexes } from './internal/normalizeArgumentsAtIndexes';
import { semanticConst } from './internal/semanticConst';
import { semanticConstants } from './internal/semanticConstants';
import { semanticConstantsEnd } from './internal/semanticConstantsEnd';
import { semanticModule } from './internal/semanticModule';
import { semanticModuleEnd } from './internal/semanticModuleEnd';
import { semanticUse } from './internal/semanticUse';
import {
	BLOCK_TYPE,
	type AST as SymbolAst,
	type CompiledFunctionLookup,
	type Namespaces,
	type SymbolResolutionContext,
} from './types';

function normalizeSymbolLine(line: SymbolAst[number], context: SymbolResolutionContext): SymbolAst[number] {
	switch (line.instruction) {
		case 'const':
			return normalizeConst(line as Parameters<typeof normalizeConst>[0], context);
		case 'default':
			return normalizeArgumentsAtIndexes(line, context, [0]).line;
		case 'map':
			return normalizeArgumentsAtIndexes(line, context, [0, 1]).line;
		case 'push':
			return normalizeArgumentsAtIndexes(line, context, [0]).line;
		default:
			return line;
	}
}

function applySymbolSemanticLine(line: AST[number], context: SymbolResolutionContext): void {
	switch (line.instruction) {
		case 'const':
			semanticConst(line as Parameters<typeof semanticConst>[0], context);
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

export function collectNormalizedAstsByAst(
	asts: AST[],
	namespaces: Namespaces,
	functions?: CompiledFunctionLookup
): ReadonlyMap<AST, AST> {
	const normalizedAstsByAst = new Map<AST, AST>();

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

		const normalizedAst = ast.map(line => {
			const normalizedLine = normalizeSymbolLine(line, context);
			if (
				normalizedLine.isSemanticOnly ||
				normalizedLine.instruction === 'function' ||
				normalizedLine.instruction === 'functionEnd'
			) {
				applySymbolSemanticLine(normalizedLine, context);
			}
			return normalizedLine;
		});

		normalizedAstsByAst.set(ast, normalizedAst);
	}

	return normalizedAstsByAst;
}
