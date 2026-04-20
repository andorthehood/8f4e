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
	type DiscoveredModuleLayouts,
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
	functions?: CompiledFunctionLookup,
	discoveredModules?: DiscoveredModuleLayouts
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
			discoveredModules,
		},
		blockStack: [],
		startingByteAddress,
		currentModuleNextWordOffset: 0,
		currentModuleWordAlignedSize: undefined,
		codeBlockType: firstLine.instruction === 'constants' ? 'constants' : 'module',
		codeBlockId: namespaceId,
	};

	const normalizedScalarDeclarations: AST[number][] = [];
	const normalizedInits: AST[number][] = [];

	for (const originalLine of ast) {
		if (originalLine.isSemanticOnly) {
			const line = normalizeLayoutLine(originalLine, context);
			if (line.instruction !== 'init') {
				applySemanticInstruction(line, context);
			} else {
				normalizedInits.push(line);
			}
			continue;
		}

		if (!originalLine.isMemoryDeclaration) {
			if (context.codeBlockType === 'constants') {
				throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, originalLine, context);
			}
			normalizeCodegenLine(originalLine, context);
			continue;
		}

		if (context.codeBlockType === 'constants') {
			throw getError(ErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK, originalLine, context);
		}

		const line = normalizeLayoutLine(originalLine, context);
		applyMemoryDeclarationLine(line, context);
		if (!line.instruction.endsWith('[]')) {
			normalizedScalarDeclarations.push(line);
		}
	}

	context.currentModuleWordAlignedSize = context.currentModuleNextWordOffset ?? 0;

	for (const line of normalizedScalarDeclarations) {
		const { id, defaultValue } = parseMemoryInstructionArguments(line, context);
		const memoryItem = context.namespace.memory[id];
		if (!memoryItem || memoryItem.numberOfElements !== 1) {
			continue;
		}

		memoryItem.default = memoryItem.isInteger ? Math.trunc(defaultValue) : defaultValue;
	}

	for (const line of normalizedInits) {
		applySemanticInstruction(line, context);
	}

	return {
		memory: context.namespace.memory,
		moduleName: context.namespace.moduleName,
		currentModuleNextWordOffset: context.currentModuleNextWordOffset ?? 0,
		currentModuleWordAlignedSize: context.currentModuleWordAlignedSize ?? 0,
	};
}
