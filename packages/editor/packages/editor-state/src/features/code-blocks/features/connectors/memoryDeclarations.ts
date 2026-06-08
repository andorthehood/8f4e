import type { CompiledModule, DataStructure, MemoryDeclarationLine } from '@8f4e/compiler-spec';
import { isMemoryDeclarationLine } from '@8f4e/compiler-spec';
import type { State } from '@8f4e/editor-state-types';

export interface ConnectorMemoryDeclaration {
	memory: DataStructure;
	position: {
		lineNumber: number;
		rowOffset: number;
	};
}

function getMemoryDeclarationId(line: MemoryDeclarationLine): string | undefined {
	const argument = line.arguments[0];
	const value = argument && 'value' in argument ? argument.value : undefined;
	return typeof value === 'string' ? value : undefined;
}

function getPrototypeMemoryDeclarationLines(state: State): Map<string, readonly MemoryDeclarationLine[]> {
	const prototypes = new Map<string, readonly MemoryDeclarationLine[]>();

	state.compiler.cache?.ast.entries.forEach(({ ast }, cacheKey) => {
		if (cacheKey.startsWith('prototype:') && ast.type === 'prototype') {
			prototypes.set(ast.id, ast.memoryDeclarationLines);
		}
	});

	return prototypes;
}

function getMemoryDeclarationPositions(
	compiledModule: CompiledModule,
	state: State
): Map<string, ConnectorMemoryDeclaration['position']> {
	const positions = new Map<string, ConnectorMemoryDeclaration['position']>();
	const prototypeMemoryDeclarationLines = getPrototypeMemoryDeclarationLines(state);

	if (compiledModule.ast?.type !== 'module') {
		return positions;
	}

	compiledModule.ast.lines.forEach(line => {
		if (line.instruction === 'shape') {
			const prototypeId = line.arguments[0].value;
			prototypeMemoryDeclarationLines.get(prototypeId)?.forEach((memoryDeclarationLine, index) => {
				const id = getMemoryDeclarationId(memoryDeclarationLine);
				if (id) {
					positions.set(id, { lineNumber: line.lineNumber, rowOffset: index + 1 });
				}
			});
			return;
		}

		if (isMemoryDeclarationLine(line)) {
			const id = getMemoryDeclarationId(line);
			if (id) {
				positions.set(id, { lineNumber: line.lineNumber, rowOffset: 0 });
			}
		}
	});

	return positions;
}

export function getConnectorMemoryDeclarations(
	compiledModule: CompiledModule | undefined,
	state: State
): ConnectorMemoryDeclaration[] {
	if (!compiledModule) {
		return [];
	}

	const positions = getMemoryDeclarationPositions(compiledModule, state);
	return Object.values(compiledModule.memoryMap)
		.map(memory => ({
			memory,
			position: positions.get(memory.id) ?? { lineNumber: memory.lineNumber, rowOffset: 0 },
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
