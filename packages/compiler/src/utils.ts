import { WORD_LENGTH } from './consts';
import { AST, CompiledModule, MemoryMap, MemoryTypes } from './types';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return memoryMap.has(name);
}

export function isMemoryReferenceIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return name.startsWith('&') && memoryMap.has(name.substring(1));
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

export function getMemoryStringEndAddress(memoryMap: MemoryMap, id: string): number {
	const memoryItem = getMemoryItem(memoryMap, id);
	return memoryItem ? memoryItem.byteAddress + memoryItem.wordSize * WORD_LENGTH : 0;
}

export function isInputPointer(memoryMap: MemoryMap, id: string): boolean {
	const memoryItem = getMemoryItem(memoryMap, id);

	if (!memoryItem) {
		return false;
	}

	return memoryItem && memoryItem.type === MemoryTypes.INPUT_POINTER;
}

export function isLocalIdentifier(locals: string[], id: string): boolean {
	return locals.indexOf(id) !== -1;
}

export function getNextFreeMemoryWordAddress(memory: MemoryMap, _default: number) {
	const { relativeWordAddress, wordSize } = Array.from(memory.values()).pop() || {
		relativeWordAddress: _default,
		wordSize: 0,
	};

	return relativeWordAddress + wordSize;
}

export function calculateMemoryWordSize(memory: MemoryMap): number {
	return Array.from(memory.values()).reduce((accumulator, current) => {
		return accumulator + (Array.isArray(current.default) ? current.default.length : 1);
	}, 0);
}

export function calculateModuleWordSize(module: CompiledModule): number {
	return calculateMemoryWordSize(module.memoryMap);
}
