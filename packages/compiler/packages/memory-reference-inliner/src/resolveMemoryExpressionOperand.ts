import type {
	CompileTimeOperand,
	Const,
	LocalMap,
	MemoryLayoutPlan,
	MemoryPointerMetadataMap,
	PlannedMemoryDeclaration,
	PlannedMemoryModule,
} from '@8f4e/compiler-spec';
import {
	ArgumentType,
	getElementCount,
	getElementMaxValue,
	getElementMinValue,
	getElementWordSize,
	getMemoryRegionFields,
	getPointeeElementIsIntegerFromMetadata,
	getPointeeElementMaxValue,
	getPointeeElementMaxValueFromMetadata,
	getPointeeElementMinValue,
	getPointeeElementMinValueFromMetadata,
	getPointeeElementWordSize,
	getPointeeElementWordSizeFromMetadata,
	type PointerMetadata,
} from '@8f4e/compiler-spec';
import {
	getWordAlignedByteLength,
	memoryEndAddressValue,
	memoryStartAddressValue,
	moduleAddressValue,
} from './addressValues';
import { getEndByteAddress } from './layoutAddresses';

export type MemoryReferenceModuleNamespace = PlannedMemoryModule;

export type MemoryReferencePointerMetadataByModuleId = Record<string, MemoryPointerMetadataMap>;

export interface MemoryReferenceResolutionContext {
	memoryPlan: MemoryLayoutPlan;
	currentModule?: PlannedMemoryModule;
	pointerMetadata: MemoryReferencePointerMetadataByModuleId;
	moduleName?: string;
	locals: LocalMap;
	startingByteAddress: number;
	currentModuleWordAlignedSize: number;
	currentMemoryIndex: number;
	currentMemoryRegionName?: string;
}

function getCurrentModuleId(context: MemoryReferenceResolutionContext): string | undefined {
	return context.moduleName ?? context.currentModule?.id;
}

function getCurrentModule(context: MemoryReferenceResolutionContext): PlannedMemoryModule | undefined {
	const moduleId = getCurrentModuleId(context);
	return context.currentModule ?? (moduleId ? context.memoryPlan.modules[moduleId] : undefined);
}

function getModule(
	context: MemoryReferenceResolutionContext,
	moduleId: string | undefined
): PlannedMemoryModule | undefined {
	if (!moduleId || moduleId === 'this') {
		return getCurrentModule(context);
	}

	return context.memoryPlan.modules[moduleId];
}

function getMemoryDeclaration(
	context: MemoryReferenceResolutionContext,
	memoryId: string,
	moduleId = getCurrentModuleId(context)
): PlannedMemoryDeclaration | undefined {
	return getModule(context, moduleId)?.memory[memoryId];
}

function getPointerMetadata(
	context: MemoryReferenceResolutionContext,
	memoryId: string,
	moduleId = getCurrentModuleId(context)
): MemoryPointerMetadataMap[string] | undefined {
	return moduleId ? context.pointerMetadata[moduleId]?.[memoryId] : undefined;
}

function getPointerFacts(
	context: MemoryReferenceResolutionContext,
	declaration: PlannedMemoryDeclaration | undefined,
	moduleId = getCurrentModuleId(context)
): PointerMetadata | undefined {
	if (!declaration) {
		return undefined;
	}

	return {
		...declaration,
		...getPointerMetadata(context, declaration.id, moduleId),
	};
}

function hasKnownPointeeElementCount(
	pointerMetadata: { pointeeBaseType?: unknown; pointeeElementCount?: number } | undefined
): pointerMetadata is { pointeeBaseType: unknown; pointeeElementCount: number } {
	return !!pointerMetadata?.pointeeBaseType && pointerMetadata.pointeeElementCount !== undefined;
}

/**
 * Tries to resolve a single pre-classified memory/layout expression operand to a value.
 * Dispatches on the operand's AST classification (`type` and `referenceKind`) directly,
 * without re-parsing raw token values.
 *
 * @param operand - Parsed operand to resolve.
 * @param context - Current semantic compilation context.
 * @returns Resolved memory/layout value, or `undefined` when the operand is not a memory expression.
 */
export function resolveMemoryExpressionOperand(
	operand: CompileTimeOperand,
	context: MemoryReferenceResolutionContext
): Const | undefined {
	if (operand.type === ArgumentType.LITERAL) {
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-word-size') {
		const targetMemory = getMemoryDeclaration(context, operand.targetMemoryId, operand.targetModuleId);
		if (targetMemory) {
			return {
				value: getElementWordSize(targetMemory),
				isInteger: true,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-count') {
		const targetMemory = getMemoryDeclaration(context, operand.targetMemoryId, operand.targetModuleId);
		if (targetMemory) {
			return {
				value: getElementCount(targetMemory),
				isInteger: true,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-max') {
		const targetMemory = getMemoryDeclaration(context, operand.targetMemoryId, operand.targetModuleId);
		if (targetMemory) {
			return {
				value: getElementMaxValue(targetMemory),
				isInteger: !!targetMemory.isInteger,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-min') {
		const targetMemory = getMemoryDeclaration(context, operand.targetMemoryId, operand.targetModuleId);
		if (targetMemory) {
			return {
				value: getElementMinValue(targetMemory),
				isInteger: !!targetMemory.isInteger,
			};
		}
		return undefined;
	}

	// count(*name) — known pointee element count
	if (operand.referenceKind === 'pointee-element-count') {
		const base = operand.targetMemoryId;
		const memoryItem = getPointerFacts(context, getMemoryDeclaration(context, base));
		if (hasKnownPointeeElementCount(memoryItem)) {
			return { value: memoryItem.pointeeElementCount, isInteger: true };
		}
		const local = context.locals[base];
		if (hasKnownPointeeElementCount(local)) {
			return { value: local.pointeeElementCount, isInteger: true };
		}
		return undefined;
	}

	// sizeof(*name) — pointee element word size
	if (operand.referenceKind === 'pointee-element-word-size') {
		const base = operand.targetMemoryId;
		const memoryItem = getPointerFacts(context, getMemoryDeclaration(context, base));
		if (memoryItem) {
			return {
				value: getPointeeElementWordSize(memoryItem),
				isInteger: true,
			};
		}
		const local = context.locals[base];
		if (local?.pointeeBaseType) {
			return { value: getPointeeElementWordSizeFromMetadata(local), isInteger: true };
		}
		return undefined;
	}

	// sizeof(name) — element word size
	if (operand.referenceKind === 'element-word-size') {
		const base = operand.targetMemoryId;
		const memoryItem = getMemoryDeclaration(context, base);
		if (memoryItem) {
			return { value: getElementWordSize(memoryItem), isInteger: true };
		}
		return undefined;
	}

	// count(name) — element count
	if (operand.referenceKind === 'element-count') {
		const base = operand.targetMemoryId;
		const memoryItem = getMemoryDeclaration(context, base);
		if (memoryItem) {
			return { value: getElementCount(memoryItem), isInteger: true };
		}
		return undefined;
	}

	// max(*name) — pointee element max value
	if (operand.referenceKind === 'pointee-element-max') {
		const base = operand.targetMemoryId;
		const memoryItem = getPointerFacts(context, getMemoryDeclaration(context, base));
		if (memoryItem) {
			return {
				value: getPointeeElementMaxValue(memoryItem),
				isInteger: getPointeeElementIsIntegerFromMetadata(memoryItem),
			};
		}
		const local = context.locals[base];
		if (local?.pointeeBaseType) {
			return {
				value: getPointeeElementMaxValueFromMetadata(local),
				isInteger: getPointeeElementIsIntegerFromMetadata(local),
			};
		}
		return undefined;
	}

	// max(name) — element max value
	if (operand.referenceKind === 'element-max') {
		const base = operand.targetMemoryId;
		const memoryItem = getMemoryDeclaration(context, base);
		if (memoryItem) {
			return {
				value: getElementMaxValue(memoryItem),
				isInteger: !!memoryItem.isInteger,
			};
		}
		return undefined;
	}

	// min(*name) — pointee element min value
	if (operand.referenceKind === 'pointee-element-min') {
		const base = operand.targetMemoryId;
		const memoryItem = getPointerFacts(context, getMemoryDeclaration(context, base));
		if (memoryItem) {
			return {
				value: getPointeeElementMinValue(memoryItem),
				isInteger: getPointeeElementIsIntegerFromMetadata(memoryItem),
			};
		}
		const local = context.locals[base];
		if (local?.pointeeBaseType) {
			return {
				value: getPointeeElementMinValueFromMetadata(local),
				isInteger: getPointeeElementIsIntegerFromMetadata(local),
			};
		}
		return undefined;
	}

	// min(name) — element min value
	if (operand.referenceKind === 'element-min') {
		const base = operand.targetMemoryId;
		const memoryItem = getMemoryDeclaration(context, base);
		if (memoryItem) {
			return {
				value: getElementMinValue(memoryItem),
				isInteger: !!memoryItem.isInteger,
			};
		}
		return undefined;
	}

	// &module: — start byte address of a module
	// module:& — end-word base byte address of a module
	if (operand.referenceKind === 'intermodular-module-reference') {
		const targetModuleId = operand.targetModuleId;
		const targetModule = getModule(context, targetModuleId);
		if (targetModule) {
			const value = operand.isEndAddress
				? getEndByteAddress(targetModule.byteAddress, targetModule.wordAlignedSize)
				: targetModule.byteAddress;
			return moduleAddressValue(
				operand.isEndAddress ? 'module-end' : 'module-start',
				value,
				targetModule.wordAlignedSize,
				targetModuleId,
				targetModule.memoryIndex,
				targetModule.memoryRegionName
			);
		}
		return undefined;
	}

	// &module:N — start byte address of the Nth memory item (0-indexed) within a module
	// &this:N — start byte address of the Nth memory item (0-indexed) within the current module
	if (operand.referenceKind === 'intermodular-module-nth-reference') {
		const targetModuleId = operand.targetModuleId;
		const targetModule = getModule(context, targetModuleId);
		const item = targetModule?.declarations[operand.targetMemoryIndex];
		if (item) {
			const memoryRegionFields = getMemoryRegionFields(item.memoryIndex, item.memoryRegionName);
			const resolvedModuleId = targetModuleId === 'this' ? getCurrentModuleId(context) : targetModuleId;
			return {
				...memoryStartAddressValue(item, resolvedModuleId),
				address: {
					...memoryRegionFields,
					safeRange: {
						source: 'module-nth-memory-start',
						...memoryRegionFields,
						byteAddress: item.byteAddress,
						safeByteLength: getWordAlignedByteLength(item.wordAlignedSize),
						moduleId: resolvedModuleId,
						...(item.id ? { memoryId: item.id } : {}),
					},
				},
			};
		}
		return undefined;
	}

	// &module:memory — start byte address of a remote memory item
	// module:memory& — end-word base byte address of a remote memory item
	if (operand.referenceKind === 'intermodular-reference') {
		const targetModuleId = operand.targetModuleId;
		const targetMemory = getMemoryDeclaration(context, operand.targetMemoryId, targetModuleId);
		if (targetMemory) {
			return operand.isEndAddress
				? memoryEndAddressValue(targetMemory, targetModuleId)
				: memoryStartAddressValue(targetMemory, targetModuleId);
		}
		return undefined;
	}

	// &name — start byte address of a local memory item
	// name& — end-word base byte address of a local memory item
	if (operand.referenceKind === 'memory-reference') {
		const base = operand.targetMemoryId;
		if (base === 'this') {
			const currentModule = getCurrentModule(context);
			if (!currentModule) {
				return undefined;
			}

			if (!operand.isEndAddress) {
				return moduleAddressValue(
					'module-start',
					currentModule.byteAddress,
					currentModule.wordAlignedSize,
					currentModule.id,
					currentModule.memoryIndex,
					currentModule.memoryRegionName
				);
			}

			const byteAddress = getEndByteAddress(currentModule.byteAddress, currentModule.wordAlignedSize);
			return {
				...moduleAddressValue(
					'module-end',
					byteAddress,
					currentModule.wordAlignedSize,
					currentModule.id,
					currentModule.memoryIndex,
					currentModule.memoryRegionName
				),
			};
		}
		const memoryItem = getMemoryDeclaration(context, base);
		if (memoryItem) {
			return operand.isEndAddress
				? memoryEndAddressValue(memoryItem, context.moduleName)
				: memoryStartAddressValue(memoryItem, context.moduleName);
		}
		return undefined;
	}

	return undefined;
}
