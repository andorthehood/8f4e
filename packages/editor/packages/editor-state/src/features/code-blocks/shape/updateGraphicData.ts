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
	if (!compiledModule || compiledModule.ast.type !== 'module') {
		return;
	}

	const inheritedDeclarationCountByLineNumber = Object.values(compiledModule.memoryMap).reduce<Map<number, number>>(
		(result, memory) => {
			if (memory.isInherited) {
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
