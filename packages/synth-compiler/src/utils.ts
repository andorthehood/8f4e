import { MemoryMap, MemoryTypes } from './types';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return memoryMap.some(({ id }) => id === name);
}

export function getMemoryItem(memoryMap, id: string): MemoryMap[number] {
	return memoryMap.find(memory => memory.id === id);
}

export function getMemoryItemByteAddress(memoryMap: MemoryMap, id: string): number {
	return getMemoryItem(memoryMap, id).byteAddress;
}

export function isInputPointer(memoryMap: MemoryMap, id: string): boolean {
	return getMemoryItem(memoryMap, id).type === MemoryTypes.INPUT_POINTER;
}

export function isLocalIdentifier(locals: string[], id: string): boolean {
	return locals.indexOf(id) !== -1;
}
