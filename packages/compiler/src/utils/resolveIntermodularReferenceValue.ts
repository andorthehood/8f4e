import { getElementMaxValue, getElementMinValue } from './memoryData';

import type { AST, ArgumentIdentifier, CompilationContext } from '../types';

export default function resolveIntermodularReferenceValue(
	identifier: ArgumentIdentifier,
	line: AST[number],
	context: CompilationContext
): number | undefined {
	if (Object.keys(context.namespace.namespaces).length === 0) {
		return undefined;
	}

	if (identifier.referenceKind === 'intermodular-module-reference') {
		const targetModuleId = identifier.targetModuleId!;
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (!targetModule) {
			return undefined;
		}

		if (typeof targetModule.byteAddress !== 'number' || typeof targetModule.wordAlignedSize !== 'number') {
			return undefined;
		}

		return identifier.isEndAddress
			? targetModule.byteAddress + (targetModule.wordAlignedSize - 1) * 4
			: targetModule.byteAddress;
	}

	if (identifier.referenceKind === 'intermodular-reference') {
		const targetModuleId = identifier.targetModuleId!;
		const targetMemoryId = identifier.targetMemoryId!;
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (!targetModule) {
			return undefined;
		}

		const targetMemory = targetModule.memory?.[targetMemoryId];

		if (!targetMemory) {
			return undefined;
		}

		return identifier.isEndAddress
			? targetMemory.byteAddress + (targetMemory.wordAlignedSize - 1) * 4
			: targetMemory.byteAddress;
	}

	if (identifier.referenceKind === 'intermodular-element-count') {
		const targetModuleId = identifier.targetModuleId!;
		const targetMemoryId = identifier.targetMemoryId!;
		const targetMemory = context.namespace.namespaces[targetModuleId]?.memory?.[targetMemoryId];

		if (!context.namespace.namespaces[targetModuleId]) {
			return undefined;
		}

		if (!targetMemory) {
			return undefined;
		}

		return targetMemory.wordAlignedSize;
	}

	if (identifier.referenceKind === 'intermodular-element-word-size') {
		const targetModuleId = identifier.targetModuleId!;
		const targetMemoryId = identifier.targetMemoryId!;
		const targetMemory = context.namespace.namespaces[targetModuleId]?.memory?.[targetMemoryId];

		if (!context.namespace.namespaces[targetModuleId]) {
			return undefined;
		}

		if (!targetMemory) {
			return undefined;
		}

		return targetMemory.elementWordSize;
	}

	if (identifier.referenceKind === 'intermodular-element-max') {
		const targetModuleId = identifier.targetModuleId!;
		const targetMemoryId = identifier.targetMemoryId!;
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (!targetModule) {
			return undefined;
		}

		if (!targetModule.memory?.[targetMemoryId]) {
			return undefined;
		}

		return getElementMaxValue(targetModule.memory, targetMemoryId);
	}

	if (identifier.referenceKind === 'intermodular-element-min') {
		const targetModuleId = identifier.targetModuleId!;
		const targetMemoryId = identifier.targetMemoryId!;
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (!targetModule) {
			return undefined;
		}

		if (!targetModule.memory?.[targetMemoryId]) {
			return undefined;
		}

		return getElementMinValue(targetModule.memory, targetMemoryId);
	}

	return undefined;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('resolveIntermodularReferenceValue', () => {
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'int*',
			arguments: [],
		} as unknown as AST[number];

		it('resolves module start-address references when namespace layout metadata is available', () => {
			const context = {
				namespace: {
					namespaces: {
						source: {
							consts: {},
							byteAddress: 12,
							wordAlignedSize: 3,
							memory: {},
						},
					},
				},
			} as unknown as CompilationContext;

			expect(resolveIntermodularReferenceValue(classifyIdentifier('&source:'), line, context)).toBe(12);
		});

		it('defers module-base references until layout metadata exists', () => {
			const context = {
				namespace: {
					namespaces: {
						source: {
							consts: {},
							memory: {},
						},
					},
				},
			} as unknown as CompilationContext;

			expect(resolveIntermodularReferenceValue(classifyIdentifier('&source:'), line, context)).toBeUndefined();
		});
	});
}
