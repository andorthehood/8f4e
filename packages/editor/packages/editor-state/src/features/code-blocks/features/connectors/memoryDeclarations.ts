import type { CompiledModule, DataStructure } from '@8f4e/compiler-spec';

export interface ConnectorMemoryDeclaration {
	memory: DataStructure;
	position: {
		lineNumber: number;
		rowOffset: number;
	};
}

function getInheritedRowOffset(memory: DataStructure, inheritedRowOffsetByLineNumber: Map<number, number>): number {
	if (!memory.isInherited) {
		return 0;
	}

	const rowOffset = (inheritedRowOffsetByLineNumber.get(memory.lineNumber) ?? 0) + 1;
	inheritedRowOffsetByLineNumber.set(memory.lineNumber, rowOffset);
	return rowOffset;
}

export function getConnectorMemoryDeclarations(
	compiledModule: CompiledModule | undefined
): ConnectorMemoryDeclaration[] {
	if (!compiledModule) {
		return [];
	}

	const inheritedRowOffsetByLineNumber = new Map<number, number>();
	return Object.values(compiledModule.memoryMap)
		.map(memory => ({
			memory,
			position: {
				lineNumber: memory.lineNumber,
				rowOffset: getInheritedRowOffset(memory, inheritedRowOffsetByLineNumber),
			},
		}))
		.sort((left, right) => {
			return (
				left.position.lineNumber - right.position.lineNumber ||
				left.position.rowOffset - right.position.rowOffset ||
				left.memory.lineNumber - right.memory.lineNumber
			);
		});
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
