import { getElementMaxValue, getElementMinValue } from '@8f4e/compiler-memory-layout';

import type { AST, ArgumentIdentifier, CompilationContext } from '../types';

export default function resolveIntermodularReferenceValue(
	identifier: ArgumentIdentifier,
	line: AST[number],
	context: CompilationContext
): number | undefined {
	if (Object.keys(context.namespace.namespaces).length === 0) {
		return undefined;
	}

	// intermodular-module-reference (&module:, module:&) and intermodular-reference
	// (&module:memory, module:memory&) are now resolved to literals during semantic
	// normalization in resolveCompileTimeOperand. This function no longer handles them.

	if (identifier.referenceKind === 'intermodular-element-count') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetNamespace = context.namespace.namespaces[targetModuleId];
		const targetMemory = targetNamespace?.kind === 'module' ? targetNamespace.memory?.[targetMemoryId] : undefined;

		if (targetNamespace?.kind !== 'module') {
			return undefined;
		}

		if (!targetMemory) {
			return undefined;
		}

		return targetMemory.wordAlignedSize;
	}

	if (identifier.referenceKind === 'intermodular-element-word-size') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetNamespace = context.namespace.namespaces[targetModuleId];
		const targetMemory = targetNamespace?.kind === 'module' ? targetNamespace.memory?.[targetMemoryId] : undefined;

		if (targetNamespace?.kind !== 'module') {
			return undefined;
		}

		if (!targetMemory) {
			return undefined;
		}

		return targetMemory.elementWordSize;
	}

	if (identifier.referenceKind === 'intermodular-element-max') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (targetModule?.kind !== 'module') {
			return undefined;
		}

		if (!targetModule.memory?.[targetMemoryId]) {
			return undefined;
		}

		return getElementMaxValue(targetModule.memory, targetMemoryId);
	}

	if (identifier.referenceKind === 'intermodular-element-min') {
		const targetModuleId = identifier.targetModuleId;
		const targetMemoryId = identifier.targetMemoryId;
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (targetModule?.kind !== 'module') {
			return undefined;
		}

		if (!targetModule.memory?.[targetMemoryId]) {
			return undefined;
		}

		return getElementMinValue(targetModule.memory, targetMemoryId);
	}

	return undefined;
}
