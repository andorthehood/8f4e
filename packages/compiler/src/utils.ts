import { WORD_LENGTH } from './consts';
import { BlockStack, CompiledModule, MemoryMap, Namespace, StackItem } from './types';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return memoryMap.has(name);
}

export function isMemoryReferenceIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return (
		(name.startsWith('&') && memoryMap.has(name.substring(1))) ||
		(name.endsWith('&') && memoryMap.has(name.slice(0, -1)))
	);
}

export function isMemoryPointerIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return name.startsWith('*') && memoryMap.has(name.substring(1));
}

export function getMemoryItem(memoryMap: MemoryMap, id: string) {
	return memoryMap.get(id);
}

export function getMemoryItemByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getMemoryItem(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress : 0;
}

export function getMemoryStringLastAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getMemoryItem(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress + (memoryItem.wordSize - 1) * WORD_LENGTH : 0;
}

export function getNextFreeMemoryWordAddress(memory: MemoryMap, _default: number) {
	const { relativeWordAddress, wordSize } = Array.from(memory.values()).pop() || {
		relativeWordAddress: _default,
		wordSize: 0,
	};

	return relativeWordAddress + wordSize;
}

export function isInstructionIsInsideAModule(blockStack: BlockStack) {
	for (let i = blockStack.length - 1; i > 0; i--) {
		if (blockStack[i].isModuleBlock) {
			return true;
		}
	}
	return false;
}

export function calculateMemoryWordSize(memory: MemoryMap): number {
	return Array.from(memory.values()).reduce((accumulator, current) => {
		return accumulator + (Array.isArray(current.default) ? current.default.length : 1);
	}, 0);
}

export function calculateModuleWordSize(module: CompiledModule): number {
	return calculateMemoryWordSize(module.memoryMap);
}

export function areAllOperandsIntegers(...operands: StackItem[]): boolean {
	return !operands.some(operand => !operand.isInteger);
}

export function areAllOperandsFloats(...operands: StackItem[]): boolean {
	return !operands.some(operand => operand.isInteger);
}
