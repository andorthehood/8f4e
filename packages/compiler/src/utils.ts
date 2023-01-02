import { WORD_LENGTH } from './consts';
import { CompiledModule, MemoryMap, MemoryTypes } from './types';

export function isMemoryIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return memoryMap.has(name);
}

export function isMemoryReferenceIdentifier(memoryMap: MemoryMap, name: string): boolean {
	return name.startsWith('&') && memoryMap.has(name.substring(1));
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

export function getNextFreeMemoryWordAddress(memory: MemoryMap, _default: number) {
	const { address, size } = Array.from(memory.values()).pop() || {
		address: _default,
		size: 0,
	};

	return address + size;
}

export function calculateMemoryWordSize(memory: MemoryMap): number {
	return Array.from(memory.values()).reduce((accumulator, current) => {
		return accumulator + (Array.isArray(current.default) ? current.default.length : 1);
	}, 0);
}

export function calculateModuleWordSize(module: CompiledModule): number {
	return calculateMemoryWordSize(module.memoryMap);
}
