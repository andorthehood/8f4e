import type { CodeBlockGraphicData, Output, State } from '@8f4e/editor-state-types';
import gapCalculator from '~/features/code-editing/gapCalculator';
import {
	type ConnectorMemoryDeclaration,
	getConnectorMemoryDeclarations,
	isOutputMemoryDeclaration,
} from '../connectors/memoryDeclarations';

const CONNECTOR_WIDTH_GRID_CELLS = 3;

function getConnectorRow(declaration: ConnectorMemoryDeclaration, graphicData: CodeBlockGraphicData): number {
	return gapCalculator(declaration.position.lineNumber, graphicData.gaps) + declaration.position.rowOffset;
}

export default function updateOutputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.widgets.outputs = [];
	if (!graphicData.name) {
		return;
	}

	const compiledModule = state.compiler.compiledModules[graphicData.name];
	getConnectorMemoryDeclarations(compiledModule, state).forEach(declaration => {
		const { memory } = declaration;
		if (!isOutputMemoryDeclaration(memory)) return;

		const width = state.viewport.vGrid * CONNECTOR_WIDTH_GRID_CELLS;
		const height = state.viewport.hGrid;
		const x = graphicData.width - 3 * state.viewport.vGrid;
		const y = getConnectorRow(declaration, graphicData) * state.viewport.hGrid;

		const out: Output = {
			width,
			height,
			x,
			y,
			wireX: Math.round(x + width / 2),
			wireY: Math.round(y + height / 2),
			id: memory.id,
			codeBlock: graphicData,
			calibratedMax: 0,
			calibratedMin: 0,
			memory,
		};

		graphicData.widgets.outputs.push(out);
		state.codeBlockRendering.outputsByWordAddress.set(memory.byteAddress, out);
	});
}
