import { getError } from './getError';
import { applyMemoryDeclarationLine } from './internal/applyMemoryDeclarationLine';
import { applySemanticLine } from './internal/applySemanticLine';
import { normalizeLayoutLine } from './internal/normalizeLayoutLine';
import { parseMemoryInstructionArguments } from './parseMemoryInstructionArguments';
import { ErrorCode, type CompiledFunctionLookup, type Namespaces, type PublicMemoryLayoutContext } from './types';

import type { AST } from '@8f4e/tokenizer';

export function prepassNamespace(
	ast: AST,
	namespaces: Namespaces,
	startingByteAddress = 0,
	functions?: CompiledFunctionLookup
): PublicMemoryLayoutContext {
	const context: PublicMemoryLayoutContext = {
		namespace: {
			namespaces,
			memory: {},
			consts: {},
			moduleName: undefined,
			functions,
		},
		blockStack: [],
		startingByteAddress,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: undefined,
		codeBlockType: ast[0]?.instruction === 'constants' ? 'constants' : 'module',
	};

	ast.forEach(originalLine => {
		if (originalLine.isSemanticOnly) {
			applySemanticLine(originalLine, context);
		} else if (originalLine.isMemoryDeclaration) {
			if (context.codeBlockType === 'constants') {
				throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, originalLine, context);
			}
			applyMemoryDeclarationLine(normalizeLayoutLine(originalLine, context), context);
		}
	});

	context.currentModuleWordAlignedSize = context.currentModuleNextWordOffset ?? 0;

	ast.forEach(originalLine => {
		if (!originalLine.isMemoryDeclaration || originalLine.instruction.endsWith('[]')) {
			return;
		}

		const line = normalizeLayoutLine(originalLine, context);
		const { id, defaultValue } = parseMemoryInstructionArguments(line, context);
		const memoryItem = context.namespace.memory[id];
		if (!memoryItem || memoryItem.numberOfElements !== 1) {
			return;
		}

		memoryItem.default = memoryItem.isInteger ? Math.trunc(defaultValue) : defaultValue;
	});

	return context;
}
