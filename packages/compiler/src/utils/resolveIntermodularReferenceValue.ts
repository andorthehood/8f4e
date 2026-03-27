import {
	INTERMODULAR_REFERENCE_PATTERN,
	extractIntermodularElementCountBase,
	extractIntermodularElementMaxBase,
	extractIntermodularElementMinBase,
	extractIntermodularElementWordSizeBase,
	extractIntermodularModuleReferenceBase,
	isIntermodularElementCountReference,
	isIntermodularElementMaxReference,
	isIntermodularElementMinReference,
	isIntermodularElementWordSizeReference,
	isIntermodularModuleReference,
} from '@8f4e/ast-parser';

import { getElementMaxValue, getElementMinValue } from './memoryData';

import { ErrorCode, getError } from '../compilerError';

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
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}

		if (typeof targetModule.byteAddress !== 'number' || typeof targetModule.wordAlignedSize !== 'number') {
			return undefined;
		}

		return isEndAddress ? targetModule.byteAddress + (targetModule.wordAlignedSize - 1) * 4 : targetModule.byteAddress;
	}

	if (INTERMODULAR_REFERENCE_PATTERN.test(refValue)) {
		const isEndAddress = refValue.endsWith('&');
		const cleanRef = isEndAddress ? refValue.slice(0, -1) : refValue.substring(1);
		const [targetModuleId, targetMemoryId] = cleanRef.split(':');
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (!targetModule) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}

		const targetMemory = targetModule.memory?.[targetMemoryId];

		if (!targetMemory) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}

		return isEndAddress ? targetMemory.byteAddress + (targetMemory.wordAlignedSize - 1) * 4 : targetMemory.byteAddress;
	}

	if (isIntermodularElementCountReference(refValue)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementCountBase(refValue);
		const targetMemory = context.namespace.namespaces[targetModuleId]?.memory?.[targetMemoryId];

		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}

		if (!targetMemory) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}

		return targetMemory.wordAlignedSize;
	}

	if (isIntermodularElementWordSizeReference(refValue)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementWordSizeBase(refValue);
		const targetMemory = context.namespace.namespaces[targetModuleId]?.memory?.[targetMemoryId];

		if (!context.namespace.namespaces[targetModuleId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}

		if (!targetMemory) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}

		return targetMemory.elementWordSize;
	}

	if (isIntermodularElementMaxReference(refValue)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMaxBase(refValue);
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (!targetModule) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}

		if (!targetModule.memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
		}

		return getElementMaxValue(targetModule.memory, targetMemoryId);
	}

	if (isIntermodularElementMinReference(refValue)) {
		const { module: targetModuleId, memory: targetMemoryId } = extractIntermodularElementMinBase(refValue);
		const targetModule = context.namespace.namespaces[targetModuleId];

		if (!targetModule) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetModuleId });
		}

		if (!targetModule.memory?.[targetMemoryId]) {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: targetMemoryId });
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
