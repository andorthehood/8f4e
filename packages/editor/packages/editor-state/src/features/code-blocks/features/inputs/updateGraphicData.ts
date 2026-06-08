import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import gapCalculator from '~/features/code-editing/gapCalculator';
import {
	type ConnectorMemoryDeclaration,
	getConnectorMemoryDeclarations,
	isInputMemoryDeclaration,
} from '../connectors/memoryDeclarations';

const CONNECTOR_WIDTH_GRID_CELLS = 3;

function getConnectorRow(declaration: ConnectorMemoryDeclaration, graphicData: CodeBlockGraphicData): number {
	return gapCalculator(declaration.position.lineNumber, graphicData.gaps) + declaration.position.rowOffset;
}

export default function updateInputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.widgets.inputs = [];
	if (!graphicData.name) {
		return;
	}

	const compiledModule = state.compiler.compiledModules[graphicData.name];
	getConnectorMemoryDeclarations(compiledModule).forEach(declaration => {
		const { memory } = declaration;
		if (!isInputMemoryDeclaration(memory)) return;

		const width = state.viewport.vGrid * CONNECTOR_WIDTH_GRID_CELLS;
		const height = state.viewport.hGrid;
		const x = 0;
		const y = getConnectorRow(declaration, graphicData) * state.viewport.hGrid;

		graphicData.widgets.inputs.push({
			width,
			height,
			x,
			y,
			wireX: Math.round(x + width / 2),
			wireY: Math.round(y + height / 2),
			id: memory.id,
			wordAlignedAddress: memory.wordAlignedAddress,
			codeBlock: graphicData,
		});
	});
}
