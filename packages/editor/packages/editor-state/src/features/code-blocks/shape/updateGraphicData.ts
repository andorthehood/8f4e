import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import gapCalculator from '../../code-editing/gapCalculator';
import type { DirectiveDerivedState } from '../features/directives/registry';

function getInheritedDeclarationRowOffsets(compiledModule: NonNullable<State['compiler']['compiledModules'][string]>) {
	const rowOffsetByLineNumber = new Map<number, number>();

	return Object.values(compiledModule.memory)
		.filter(memory => compiledModule.memoryDefaults[memory.id]!.isInherited === true)
		.map(memory => {
			const rowOffset = (rowOffsetByLineNumber.get(memory.lineNumber) ?? 0) + 1;
			rowOffsetByLineNumber.set(memory.lineNumber, rowOffset);

			return { memory, rowOffset };
		})
		.sort((left, right) => {
			return left.memory.lineNumber - right.memory.lineNumber || left.rowOffset - right.rowOffset;
		});
}

export default function shape(
	graphicData: CodeBlockGraphicData,
	state: State,
	directiveState: DirectiveDerivedState
): void {
	graphicData.widgets.shapeDeclarations = [];
	if (graphicData.disabled || graphicData.blockType !== 'module') {
		return;
	}

	const compiledModule = graphicData.name ? state.compiler.compiledModules[graphicData.name] : undefined;
	if (!compiledModule || compiledModule.ast.type !== 'module') {
		return;
	}

	const inheritedDeclarationCountByLineNumber = Object.values(compiledModule.memory).reduce<Map<number, number>>(
		(result, memory) => {
			if (compiledModule.memoryDefaults[memory.id]!.isInherited === true) {
				result.set(memory.lineNumber, (result.get(memory.lineNumber) ?? 0) + 1);
			}
			return result;
		},
		new Map()
	);

	compiledModule.ast.lines.forEach(line => {
		if (line.instruction !== 'shape') {
			return;
		}

		const inheritedDeclarationCount = inheritedDeclarationCountByLineNumber.get(line.lineNumber) ?? 0;
		if (inheritedDeclarationCount === 0) {
			return;
		}

		directiveState.layoutContributions.push({
			rawRow: line.lineNumber,
			rows: inheritedDeclarationCount,
		});
	});
}

export function updateShapeDeclarations(
	graphicData: CodeBlockGraphicData,
	state: State,
	directiveState: DirectiveDerivedState
): void {
	graphicData.widgets.shapeDeclarations = [];
	if (graphicData.disabled || graphicData.blockType !== 'module') {
		return;
	}

	const compiledModule = graphicData.name ? state.compiler.compiledModules[graphicData.name] : undefined;
	if (!compiledModule || compiledModule.ast.type !== 'module') {
		return;
	}

	const textX = (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid;
	for (const { memory, rowOffset } of getInheritedDeclarationRowOffsets(compiledModule)) {
		const displayRow = directiveState.displayModel.rawRowToDisplayRow[memory.lineNumber];
		if (displayRow === undefined) {
			continue;
		}

		graphicData.widgets.shapeDeclarations.push({
			x: textX,
			y: (gapCalculator(displayRow, graphicData.gaps) + rowOffset) * state.viewport.hGrid,
			text: `${memory.type} ${memory.id}`,
		});
	}
}
