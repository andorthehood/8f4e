import type { CompiledModule, DataStructure } from '@8f4e/compiler-spec';

export function getConnectorMemoryDeclarations(compiledModule: CompiledModule | undefined): DataStructure[] {
	return Object.values(compiledModule?.memoryMap ?? {}).sort((left, right) => left.lineNumber - right.lineNumber);
}

export function isInputMemoryDeclaration(memory: DataStructure): boolean {
	return memory.pointerDepth > 0;
}

function isPrivateOutputId(id: string): boolean {
	return id.startsWith('_') && !id.startsWith('__anonymous__');
}

export function isOutputMemoryDeclaration(memory: DataStructure): boolean {
	return memory.pointerDepth === 0 && !isPrivateOutputId(memory.id);
}
