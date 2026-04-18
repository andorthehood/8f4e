import { ArgumentType, type CompileTimeOperand } from '@8f4e/tokenizer';

import { getEndByteAddress } from '../addresses/getEndByteAddress';
import { getModuleEndByteAddress } from '../addresses/getModuleEndByteAddress';
import { getDataStructureByteAddress } from '../memory-data/getDataStructureByteAddress';
import { getElementCount } from '../memory-data/getElementCount';
import { getElementMaxValue } from '../memory-data/getElementMaxValue';
import { getElementMinValue } from '../memory-data/getElementMinValue';
import { getElementWordSize } from '../memory-data/getElementWordSize';
import { getMemoryStringLastByteAddress } from '../memory-data/getMemoryStringLastByteAddress';
import { getPointeeElementMaxValue } from '../memory-data/getPointeeElementMaxValue';
import { getPointeeElementWordSize } from '../memory-data/getPointeeElementWordSize';

import type { Const, PublicMemoryLayoutContext } from '../types';

export function resolveCompileTimeOperand(
	operand: CompileTimeOperand,
	context: PublicMemoryLayoutContext
): Const | undefined {
	const { namespace } = context;
	if (operand.type === ArgumentType.LITERAL) {
		return {
			value: operand.value,
			isInteger: operand.isInteger,
			...(operand.isFloat64 ? { isFloat64: true } : {}),
		};
	}

	if (operand.referenceKind === 'constant' || operand.referenceKind === 'plain') {
		return namespace.consts[operand.value];
	}

	const { memory } = namespace;

	if (
		operand.referenceKind === 'intermodular-element-word-size' ||
		operand.referenceKind === 'intermodular-element-count' ||
		operand.referenceKind === 'intermodular-element-max' ||
		operand.referenceKind === 'intermodular-element-min'
	) {
		const targetMemory =
			namespace.namespaces[operand.targetModuleId]?.kind === 'module'
				? namespace.namespaces[operand.targetModuleId]?.memory
				: undefined;
		if (!targetMemory || !Object.hasOwn(targetMemory, operand.targetMemoryId)) {
			return undefined;
		}
		const memoryItem = targetMemory[operand.targetMemoryId];
		if (operand.referenceKind === 'intermodular-element-word-size') {
			return { value: getElementWordSize(targetMemory, operand.targetMemoryId), isInteger: true };
		}
		if (operand.referenceKind === 'intermodular-element-count') {
			return { value: getElementCount(targetMemory, operand.targetMemoryId), isInteger: true };
		}
		if (operand.referenceKind === 'intermodular-element-max') {
			return { value: getElementMaxValue(targetMemory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
		}
		return { value: getElementMinValue(targetMemory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'pointee-element-word-size' && Object.hasOwn(memory, operand.targetMemoryId)) {
		return { value: getPointeeElementWordSize(memory, operand.targetMemoryId), isInteger: true };
	}

	if (operand.referenceKind === 'element-word-size' && Object.hasOwn(memory, operand.targetMemoryId)) {
		return { value: getElementWordSize(memory, operand.targetMemoryId), isInteger: true };
	}

	if (operand.referenceKind === 'element-count' && Object.hasOwn(memory, operand.targetMemoryId)) {
		return { value: getElementCount(memory, operand.targetMemoryId), isInteger: true };
	}

	if (operand.referenceKind === 'pointee-element-max' && Object.hasOwn(memory, operand.targetMemoryId)) {
		const memoryItem = memory[operand.targetMemoryId];
		return { value: getPointeeElementMaxValue(memory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'element-max' && Object.hasOwn(memory, operand.targetMemoryId)) {
		const memoryItem = memory[operand.targetMemoryId];
		return { value: getElementMaxValue(memory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'element-min' && Object.hasOwn(memory, operand.targetMemoryId)) {
		const memoryItem = memory[operand.targetMemoryId];
		return { value: getElementMinValue(memory, operand.targetMemoryId), isInteger: !!memoryItem?.isInteger };
	}

	if (operand.referenceKind === 'intermodular-module-reference') {
		const targetNamespace = namespace.namespaces[operand.targetModuleId];
		if (
			targetNamespace?.kind === 'module' &&
			typeof targetNamespace.byteAddress === 'number' &&
			typeof targetNamespace.wordAlignedSize === 'number'
		) {
			return {
				value: operand.isEndAddress
					? getModuleEndByteAddress(targetNamespace.byteAddress, targetNamespace.wordAlignedSize)
					: targetNamespace.byteAddress,
				isInteger: true,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'intermodular-module-nth-reference') {
		const targetNamespace = namespace.namespaces[operand.targetModuleId];
		if (
			targetNamespace?.kind !== 'module' ||
			typeof targetNamespace.byteAddress !== 'number' ||
			!targetNamespace.memory
		) {
			return undefined;
		}
		const item = Object.values(targetNamespace.memory)[operand.targetMemoryIndex];
		return item ? { value: item.byteAddress, isInteger: true } : undefined;
	}

	if (operand.referenceKind === 'intermodular-reference') {
		const targetNamespace = namespace.namespaces[operand.targetModuleId];
		if (targetNamespace?.kind !== 'module' || typeof targetNamespace.byteAddress !== 'number') {
			return undefined;
		}
		const targetMemory = targetNamespace.memory?.[operand.targetMemoryId];
		if (targetMemory) {
			return {
				value: operand.isEndAddress
					? getEndByteAddress(targetMemory.byteAddress, targetMemory.wordAlignedSize)
					: targetMemory.byteAddress,
				isInteger: true,
			};
		}
		return undefined;
	}

	if (operand.referenceKind === 'memory-reference') {
		const base = operand.targetMemoryId;
		if (base === 'this') {
			if (!operand.isEndAddress) {
				return { value: context.startingByteAddress, isInteger: true };
			}
			if (typeof context.currentModuleWordAlignedSize === 'number') {
				return {
					value: getModuleEndByteAddress(context.startingByteAddress, context.currentModuleWordAlignedSize),
					isInteger: true,
				};
			}
			return undefined;
		}
		if (Object.hasOwn(memory, base)) {
			return {
				value: operand.isEndAddress
					? getMemoryStringLastByteAddress(memory, base)
					: getDataStructureByteAddress(memory, base),
				isInteger: true,
			};
		}
	}

	return undefined;
}
