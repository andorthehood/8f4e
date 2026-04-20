import { type AST, type ConstantsLine, type ModuleLine } from '@8f4e/tokenizer';

import { getError } from './getError';
import { applyMemoryDeclarationLine } from './internal/applyMemoryDeclarationLine';
import { applySemanticInstruction } from './internal/applySemanticInstruction';
import { normalizeCodegenLine } from './internal/normalizeCodegenLine';
import { normalizeLayoutLine } from './internal/normalizeLayoutLine';
import { parseMemoryInstructionArguments } from './parseMemoryInstructionArguments';
import {
	ErrorCode,
	type CompiledFunctionLookup,
	type ModuleLayout,
	type Namespaces,
	type PublicMemoryLayoutContext,
} from './internalTypes';
import { type PublicMemoryPlan } from './types';

export function planPublicMemoryNamespace(
	ast: AST,
	namespaces: Namespaces,
	modules: Record<string, ModuleLayout>,
	startingByteAddress = 0,
	functions?: CompiledFunctionLookup
): PublicMemoryPlan {
	const firstLine = ast[0] as ModuleLine | ConstantsLine;
	const namespaceId = firstLine.arguments[0].value;
	const seededNamespace = namespaceId ? namespaces[namespaceId] : undefined;
	const context: PublicMemoryLayoutContext = {
		namespace: {
			namespaces,
			modules,
			memory: {},
			consts: { ...(seededNamespace?.consts ?? {}) },
			moduleName: namespaceId,
			functions,
		},
		blockStack: [],
		startingByteAddress,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: undefined,
		codeBlockType: firstLine.instruction === 'constants' ? 'constants' : 'module',
		codeBlockId: namespaceId,
	};

	const normalizedAst = ast.map(originalLine => {
		if (originalLine.isSemanticOnly) {
			const line = normalizeLayoutLine(originalLine, context);
			if (line.instruction !== 'init') {
				applySemanticInstruction(line, context);
			}
			return line;
		}

		if (!originalLine.isMemoryDeclaration) {
			if (context.codeBlockType === 'constants') {
				throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, originalLine, context);
			}
			return normalizeCodegenLine(originalLine, context);
		}

		if (context.codeBlockType === 'constants') {
			throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, originalLine, context);
		}

		const line = normalizeLayoutLine(originalLine, context);
		applyMemoryDeclarationLine(line, context);
		return line;
	});

	context.currentModuleWordAlignedSize = context.currentModuleNextWordOffset ?? 0;

	normalizedAst.forEach(line => {
		if (!line.isMemoryDeclaration || line.instruction.endsWith('[]')) {
			return;
		}

		const { id, defaultValue } = parseMemoryInstructionArguments(line, context);
		const memoryItem = context.namespace.memory[id];
		if (!memoryItem || memoryItem.numberOfElements !== 1) {
			return;
		}

		memoryItem.default = memoryItem.isInteger ? Math.trunc(defaultValue) : defaultValue;
	});

	normalizedAst.forEach(line => {
		if (line.instruction === 'init') {
			applySemanticInstruction(line, context);
		}
	});

	return {
		normalizedAst,
		memory: context.namespace.memory,
		moduleName: context.namespace.moduleName,
		currentModuleNextWordOffset: context.currentModuleNextWordOffset ?? 0,
		currentModuleWordAlignedSize: context.currentModuleWordAlignedSize ?? 0,
	};
}
