import type { CompiledModule, PlannedMemoryDeclaration } from '@8f4e/compiler-spec';
import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import gapCalculator from '~/features/code-editing/gapCalculator';

export interface ConnectorMemoryDeclaration {
	memory: PlannedMemoryDeclaration;
	position: {
		lineNumber: number;
		rowOffset: number;
	};
}

function getInheritedRowOffset(
	memory: PlannedMemoryDeclaration,
	compiledModule: CompiledModule,
	inheritedRowOffsetByLineNumber: Map<number, number>
): number {
	if (compiledModule.memoryDefaults[memory.id]!.isInherited !== true) {
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
	return Object.values(compiledModule.memory)
		.map(memory => ({
			memory,
			position: {
				lineNumber: memory.lineNumber,
				rowOffset: getInheritedRowOffset(memory, compiledModule, inheritedRowOffsetByLineNumber),
			},
		}))
		.sort((left, right) => {
			return left.position.lineNumber - right.position.lineNumber || left.position.rowOffset - right.position.rowOffset;
		});
}

export function getConnectorRow(declaration: ConnectorMemoryDeclaration, gaps: CodeBlockGraphicData['gaps']): number {
	return gapCalculator(declaration.position.lineNumber, gaps) + declaration.position.rowOffset;
}

export function isInputMemoryDeclaration(memory: PlannedMemoryDeclaration): boolean {
	return memory.pointerDepth > 0;
}

function isPrivateOutputId(id: string): boolean {
	return id.startsWith('_') && !id.startsWith('__anonymous__');
}

export function isOutputMemoryDeclaration(memory: PlannedMemoryDeclaration): boolean {
	return memory.pointerDepth === 0 && !isPrivateOutputId(memory.id);
}
