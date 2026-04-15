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

		it('returns undefined for intermodular-module-reference (now handled by resolveCompileTimeOperand)', () => {
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

			expect(resolveIntermodularReferenceValue(classifyIdentifier('&source:'), line, context)).toBeUndefined();
		});

		it('returns undefined for intermodular-reference (now handled by resolveCompileTimeOperand)', () => {
			const context = {
				namespace: {
					namespaces: {
						source: {
							consts: {},
							byteAddress: 12,
							wordAlignedSize: 3,
							memory: {
								buf: { byteAddress: 12, wordAlignedSize: 2, numberOfElements: 2, elementWordSize: 4 },
							},
						},
					},
				},
			} as unknown as CompilationContext;

			expect(resolveIntermodularReferenceValue(classifyIdentifier('&source:buf'), line, context)).toBeUndefined();
		});
	});
}
