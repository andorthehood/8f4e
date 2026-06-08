import type { MemoryDeclarationLine } from '@8f4e/compiler-spec';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { DirectiveDerivedState } from '../features/directives/registry';

function getPrototypeMemoryDeclarationLines(state: State): Map<string, readonly MemoryDeclarationLine[]> {
	const prototypes = new Map<string, readonly MemoryDeclarationLine[]>();

	state.compiler.cache?.ast.entries.forEach(({ ast }, cacheKey) => {
		if (cacheKey.startsWith('prototype:') && ast.type === 'prototype') {
			prototypes.set(ast.id, ast.memoryDeclarationLines);
		}
	});

	return prototypes;
}

export default function shape(
	graphicData: CodeBlockGraphicData,
	state: State,
	directiveState: DirectiveDerivedState
): void {
	if (graphicData.disabled || graphicData.blockType !== 'module') {
		return;
	}

	const compiledModule = graphicData.name ? state.compiler.compiledModules[graphicData.name] : undefined;
	if (!compiledModule || compiledModule.ast.type !== 'module') {
		return;
	}

	const prototypeMemoryDeclarationLines = getPrototypeMemoryDeclarationLines(state);
	compiledModule.ast.lines.forEach(line => {
		if (line.instruction !== 'shape') {
			return;
		}

		const inheritedDeclarationCount = prototypeMemoryDeclarationLines.get(line.arguments[0].value)?.length ?? 0;
		if (inheritedDeclarationCount === 0) {
			return;
		}

		directiveState.layoutContributions.push({
			rawRow: line.lineNumber,
			rows: inheritedDeclarationCount,
		});
	});
}
