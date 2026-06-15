import type { CompilationContext, CompileTimeOperand, Const } from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import {
	getWordAlignedByteLength,
	memoryEndAddressValue,
	memoryStartAddressValue,
	moduleAddressValue,
} from './addressValues';
import { getEndByteAddress } from './layoutAddresses';
import {
	getElementCount,
	getElementMaxValue,
	getElementMinValue,
	getElementWordSize,
	getPointeeElementIsIntegerFromMetadata,
	getPointeeElementMaxValue,
	getPointeeElementMaxValueFromMetadata,
	getPointeeElementMinValue,
	getPointeeElementMinValueFromMetadata,
	getPointeeElementWordSize,
	getPointeeElementWordSizeFromMetadata,
} from './memoryData';
import { getMemoryRegionFields } from './memoryRegions';

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
	context: CompilationContext
): Const | undefined {
	const { namespace } = context;
	if (operand.type === ArgumentType.LITERAL) {
		return undefined;
	}

	const { memory } = namespace;

	if (operand.referenceKind === 'intermodular-element-word-size') {
		const targetMemory =
			namespace.namespaces[operand.targetModuleId]?.kind === 'module'
				? namespace.namespaces[operand.targetModuleId]?.memory
				: undefined;
		if (targetMemory && Object.hasOwn(targetMemory, operand.targetMemoryId)) {
			return {
				value: getElementWordSize(targetMemory, operand.targetMemoryId),
				isInteger: true,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-count') {
		const targetMemory =
			namespace.namespaces[operand.targetModuleId]?.kind === 'module'
				? namespace.namespaces[operand.targetModuleId]?.memory
				: undefined;
		if (targetMemory && Object.hasOwn(targetMemory, operand.targetMemoryId)) {
			return {
				value: getElementCount(targetMemory, operand.targetMemoryId),
				isInteger: true,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-max') {
		const targetMemory =
			namespace.namespaces[operand.targetModuleId]?.kind === 'module'
				? namespace.namespaces[operand.targetModuleId]?.memory
				: undefined;
		if (targetMemory && Object.hasOwn(targetMemory, operand.targetMemoryId)) {
			const memoryItem = targetMemory[operand.targetMemoryId];
			return {
				value: getElementMaxValue(targetMemory, operand.targetMemoryId),
				isInteger: !!memoryItem?.isInteger,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-element-min') {
		const targetMemory =
			namespace.namespaces[operand.targetModuleId]?.kind === 'module'
				? namespace.namespaces[operand.targetModuleId]?.memory
				: undefined;
		if (targetMemory && Object.hasOwn(targetMemory, operand.targetMemoryId)) {
			const memoryItem = targetMemory[operand.targetMemoryId];
			return {
				value: getElementMinValue(targetMemory, operand.targetMemoryId),
				isInteger: !!memoryItem?.isInteger,
			};
		}
		return undefined;
	}

	// count(*name) — known pointee element count
	if (operand.referenceKind === 'pointee-element-count') {
		const base = operand.targetMemoryId;
		const memoryItem = memory[base];
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
		if (Object.hasOwn(memory, base)) {
			return {
				value: getPointeeElementWordSize(memory, base),
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
		if (Object.hasOwn(memory, base)) {
			return { value: getElementWordSize(memory, base), isInteger: true };
		}
		return undefined;
	}

	// count(name) — element count
	if (operand.referenceKind === 'element-count') {
		const base = operand.targetMemoryId;
		if (Object.hasOwn(memory, base)) {
			return { value: getElementCount(memory, base), isInteger: true };
		}
		return undefined;
	}

	// max(*name) — pointee element max value
	if (operand.referenceKind === 'pointee-element-max') {
		const base = operand.targetMemoryId;
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return {
				value: getPointeeElementMaxValue(memory, base),
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
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return {
				value: getElementMaxValue(memory, base),
				isInteger: !!memoryItem?.isInteger,
			};
		}
		return undefined;
	}

	// min(*name) — pointee element min value
	if (operand.referenceKind === 'pointee-element-min') {
		const base = operand.targetMemoryId;
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return {
				value: getPointeeElementMinValue(memory, base),
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
		if (Object.hasOwn(memory, base)) {
			const memoryItem = memory[base];
			return {
				value: getElementMinValue(memory, base),
				isInteger: !!memoryItem?.isInteger,
			};
		}
		return undefined;
	}

	// &module: — start byte address of a module
	// module:& — end-word base byte address of a module
	if (operand.referenceKind === 'intermodular-module-reference') {
		const targetModuleId = operand.targetModuleId;
		const targetNamespace = namespace.namespaces[targetModuleId];
		if (
			targetNamespace?.kind === 'module' &&
			typeof targetNamespace.byteAddress === 'number' &&
			typeof targetNamespace.wordAlignedSize === 'number'
		) {
			const value = operand.isEndAddress
				? getEndByteAddress(targetNamespace.byteAddress, targetNamespace.wordAlignedSize)
				: targetNamespace.byteAddress;
			return moduleAddressValue(
				operand.isEndAddress ? 'module-end' : 'module-start',
				value,
				targetNamespace.wordAlignedSize,
				targetModuleId,
				targetNamespace.memoryIndex,
				targetNamespace.memoryRegionName
			);
		}
		return undefined;
	}

	// &module:N — start byte address of the Nth memory item (0-indexed) within a module
	// &this:N — start byte address of the Nth memory item (0-indexed) within the current module
	if (operand.referenceKind === 'intermodular-module-nth-reference') {
		const targetModuleId = operand.targetModuleId;
		const targetNamespace =
			targetModuleId === 'this'
				? {
						kind: 'module' as const,
						byteAddress: context.startingByteAddress,
						wordAlignedSize: context.currentModuleWordAlignedSize,
						memory,
						isMemoryLayoutFinalized: true,
					}
				: namespace.namespaces[targetModuleId];
		if (
			targetNamespace?.kind !== 'module' ||
			typeof targetNamespace.byteAddress !== 'number' ||
			(targetModuleId !== 'this' && targetNamespace.isMemoryLayoutFinalized !== true) ||
			!targetNamespace.memory
		) {
			return undefined;
		}
		const items = Object.values(targetNamespace.memory);
		const item = items[operand.targetMemoryIndex];
		if (item) {
			const memoryRegionFields = getMemoryRegionFields(item.memoryIndex, item.memoryRegionName);
			const resolvedModuleId = targetModuleId === 'this' ? context.namespace.moduleName : targetModuleId;
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
		const targetNamespace = namespace.namespaces[targetModuleId];
		// Only resolve once the target module has been laid out (byteAddress is set on the namespace entry)
		if (targetNamespace?.kind !== 'module' || typeof targetNamespace.byteAddress !== 'number') {
			return undefined;
		}
		const targetMemory = targetNamespace.memory?.[operand.targetMemoryId];
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
			if (!operand.isEndAddress) {
				return moduleAddressValue(
					'module-start',
					context.startingByteAddress,
					context.currentModuleWordAlignedSize,
					context.namespace.moduleName,
					context.currentMemoryIndex,
					context.currentMemoryRegionName
				);
			}
			if (typeof context.currentModuleWordAlignedSize === 'number') {
				const byteAddress = getEndByteAddress(context.startingByteAddress, context.currentModuleWordAlignedSize);
				return {
					...moduleAddressValue(
						'module-end',
						byteAddress,
						context.currentModuleWordAlignedSize,
						context.namespace.moduleName,
						context.currentMemoryIndex,
						context.currentMemoryRegionName
					),
				};
			}
			return undefined;
		}
		if (Object.hasOwn(memory, base)) {
			return operand.isEndAddress ? memoryEndAddressValue(memory[base]) : memoryStartAddressValue(memory[base]);
		}
		return undefined;
	}

	return undefined;
}
