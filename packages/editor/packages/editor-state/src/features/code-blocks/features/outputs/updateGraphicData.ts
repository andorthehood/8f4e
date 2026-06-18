import type { CodeBlockGraphicData, Output, State } from '@8f4e/editor-state-types';
import {
	getConnectorMemoryDeclarations,
	getConnectorRow,
	isOutputMemoryDeclaration,
} from '../connectors/memoryDeclarations';

const CONNECTOR_WIDTH_GRID_CELLS = 3;

export default function updateOutputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.widgets.outputs = [];
	if (!graphicData.name) {
		return;
	}

	const plannedModule = state.compiler.memoryPlan.modules[graphicData.name];
	const memoryDefaults = state.compiler.memoryDefaultsByModuleId[graphicData.name];
	getConnectorMemoryDeclarations(plannedModule, memoryDefaults).forEach(declaration => {
		const { memory } = declaration;
		if (!isOutputMemoryDeclaration(memory)) return;

		const width = state.viewport.vGrid * CONNECTOR_WIDTH_GRID_CELLS;
		const height = state.viewport.hGrid;
		const x = graphicData.width - 3 * state.viewport.vGrid;
		const y = getConnectorRow(declaration, graphicData.gaps) * state.viewport.hGrid;

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
