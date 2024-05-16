import { GLOBAL_ALIGNMENT_BOUNDARY } from './consts';
import { BlockStack, CompiledModule, MemoryMap, StackItem } from './types';

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

export function isWordSpanIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return name.startsWith('$') && memoryMap.has(name.substring(1));
}

export function isWordSizeIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return name.startsWith('%') && memoryMap.has(name.substring(1));
}

export function getDataStructure(memoryMap: MemoryMap, id: string) {
	return memoryMap.get(id);
}

export function getDataStructureByteAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress : 0;
}

export function getMemoryStringLastAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress + (memoryItem.wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY : 0;
}

export function getWordSpan(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.wordAlignedSize : 0;
}

export function getWordSize(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getDataStructure(memoryMap, id);
	return memoryItem ? memoryItem.elementWordSize : 0;
}

export function isInstructionIsInsideAModule(blockStack: BlockStack) {
	for (let i = blockStack.length - 1; i > 0; i--) {
		if (blockStack[i].isModuleBlock) {
			return true;
		}
	}
	return false;
}

export function isInstructionIsInsideAGroup(blockStack: BlockStack) {
	return blockStack[blockStack.length - 1] && blockStack[blockStack.length - 1].isGroupBlock;
}

export function calculateMemoryWordSize(memory: MemoryMap): number {
	return Array.from(memory.values()).reduce((accumulator, current) => {
		return accumulator + current.wordAlignedSize;
	}, 0);
}

export function areAllOperandsIntegers(...operands: StackItem[]): boolean {
	return !operands.some(operand => !operand.isInteger);
}

export function areAllOperandsFloats(...operands: StackItem[]): boolean {
	return !operands.some(operand => operand.isInteger);
}
