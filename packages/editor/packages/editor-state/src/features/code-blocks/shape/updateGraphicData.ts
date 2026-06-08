import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { DirectiveDerivedState } from '../features/directives/registry';

export default function shape(
	graphicData: CodeBlockGraphicData,
	state: State,
	directiveState: DirectiveDerivedState
): void {
	if (graphicData.disabled || graphicData.blockType !== 'module') {
		return;
	}

	const compiledModule = graphicData.name ? state.compiler.compiledModules[graphicData.name] : undefined;
	compiledModule?.shapeExpansions?.forEach(shapeExpansion => {
		const inheritedDeclarationCount = shapeExpansion.memoryDeclarationLines.length;
		if (inheritedDeclarationCount === 0) {
			return;
		}

		directiveState.layoutContributions.push({
			rawRow: shapeExpansion.lineNumber,
			rows: inheritedDeclarationCount,
		});
	});
}
