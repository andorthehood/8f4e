import { WORD_LENGTH } from './consts';
import { MemoryMap, MemoryTypes } from './types';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return memoryMap.has(name);
}

export function getMemoryItem(memoryMap: MemoryMap, id: string) {
	return memoryMap.get(id);
}

export function getMemoryItemByteAddress(memoryMap: MemoryMap, id: string): number {
	return getMemoryItem(memoryMap, id).byteAddress;
}

export function getMemoryStringEndAddress(memoryMap: MemoryMap, id: string): number {
	return getMemoryItem(memoryMap, id).byteAddress + getMemoryItem(memoryMap, id).size * WORD_LENGTH;
}

export function isInputPointer(memoryMap: MemoryMap, id: string): boolean {
	return getMemoryItem(memoryMap, id).type === MemoryTypes.INPUT_POINTER;
}

export function isLocalIdentifier(locals: string[], id: string): boolean {
	return locals.indexOf(id) !== -1;
}
