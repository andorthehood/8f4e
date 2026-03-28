import {
	extractIntermodularElementCountBase,
	extractIntermodularElementMaxBase,
	extractIntermodularElementMinBase,
	extractIntermodularElementWordSizeBase,
	extractIntermodularModuleReferenceBase,
	isIntermodularElementCountReference,
	isIntermodularElementMaxReference,
	isIntermodularElementMinReference,
	isIntermodularElementWordSizeReference,
	isIntermodularReference,
	isIntermodularModuleReference,
} from '@8f4e/tokenizer';

import { getElementMaxValue, getElementMinValue } from './memoryData';

import type { AST, CompilationContext } from '../types';

export default function resolveIntermodularReferenceValue(
	refValue: string,
	line: AST[number],
	context: CompilationContext
): number | undefined {
	if (Object.keys(context.namespace.namespaces).length === 0) {
		return undefined;
	}

	if (isIntermodularModuleReference(refValue)) {
		const { module: targetModuleId, isEndAddress } = extractIntermodularModuleReferenceBase(refValue);
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (!targetModule) {
			return undefined;
		}

		if (typeof targetModule.byteAddress !== 'number' || typeof targetModule.wordAlignedSize !== 'number') {
			return undefined;
		}

		return isEndAddress ? targetModule.byteAddress + (targetModule.wordAlignedSize - 1) * 4 : targetModule.byteAddress;
	}

	if (isIntermodularReference(refValue)) {
		const isEndAddress = refValue.endsWith('&');
		const cleanRef = isEndAddress ? refValue.slice(0, -1) : refValue.substring(1);
		const [targetModuleId, targetMemoryId] = cleanRef.split(':');
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (!targetModule) {
			return undefined;
		}

		const targetMemory = targetModule.memory?.[targetMemoryId];

		if (!targetMemory) {
			return undefined;
		}

		return isEndAddress ? targetMemory.byteAddress + (targetMemory.wordAlignedSize - 1) * 4 : targetMemory.byteAddress;
	}

	if (isIntermodularElementCountReference(refValue)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementCountBase(refValue);
		const targetMemory = context.namespace.namespaces[targetModuleId]?.memory?.[targetMemoryId];

		if (!context.namespace.namespaces[targetModuleId]) {
			return undefined;
		}

		if (!targetMemory) {
			return undefined;
		}

		return targetMemory.wordAlignedSize;
	}

	if (isIntermodularElementWordSizeReference(refValue)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementWordSizeBase(refValue);
		const targetMemory = context.namespace.namespaces[targetModuleId]?.memory?.[targetMemoryId];

		if (!context.namespace.namespaces[targetModuleId]) {
			return undefined;
		}

		if (!targetMemory) {
			return undefined;
		}

		return targetMemory.elementWordSize;
	}

	if (isIntermodularElementMaxReference(refValue)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMaxBase(refValue);
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (!targetModule) {
			return undefined;
		}

		if (!targetModule.memory?.[targetMemoryId]) {
			return undefined;
		}

		return getElementMaxValue(targetModule.memory, targetMemoryId);
	}

	if (isIntermodularElementMinReference(refValue)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMinBase(refValue);
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

			expect(resolveIntermodularReferenceValue('&source:', line, context)).toBe(12);
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

			expect(resolveIntermodularReferenceValue('&source:', line, context)).toBeUndefined();
		});
	});
}
