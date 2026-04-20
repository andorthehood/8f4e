import { getElementMaxValue, getElementMinValue } from '@8f4e/compiler-memory-layout';

import type { AST, ArgumentIdentifier, CompilationContext } from '../types';

export default function resolveIntermodularReferenceValue(
	identifier: ArgumentIdentifier,
	line: AST[number],
	context: CompilationContext
): number | undefined {
	const modules = context.namespace.modules ?? {};
	if (Object.keys(modules).length === 0) {
		return undefined;
	}

	// intermodular-module-reference (&module:, module:&) and intermodular-reference
	// (&module:memory, module:memory&) are now resolved to literals during semantic
	// normalization in resolveCompileTimeOperand. This function no longer handles them.

	if (identifier.referenceKind === 'intermodular-element-count') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetModule = modules[targetModuleId];
		const targetMemory = targetModule?.memory[targetMemoryId];

		if (!targetModule || !targetMemory) {
			return undefined;
		}

		return targetMemory.wordAlignedSize;
	}

	if (identifier.referenceKind === 'intermodular-element-word-size') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetModule = modules[targetModuleId];
		const targetMemory = targetModule?.memory[targetMemoryId];

		if (!targetModule || !targetMemory) {
			return undefined;
		}

		return targetMemory.elementWordSize;
	}

	if (identifier.referenceKind === 'intermodular-element-max') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetModule = modules[targetModuleId];
		if (!targetModule) {
			return undefined;
		}

		if (!targetModule.memory[targetMemoryId]) {
			return undefined;
		}

		return getElementMaxValue(targetModule.memory, targetMemoryId);
	}

	if (identifier.referenceKind === 'intermodular-element-min') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetModule = modules[targetModuleId];
		if (!targetModule) {
			return undefined;
		}

		if (!targetModule.memory[targetMemoryId]) {
			return undefined;
		}

		return getElementMinValue(targetModule.memory, targetMemoryId);
	}

	return undefined;
}
