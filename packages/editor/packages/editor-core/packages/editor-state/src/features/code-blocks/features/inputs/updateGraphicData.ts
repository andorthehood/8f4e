import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import getCodeBlockModuleId from '../../../../pureHelpers/getCodeBlockModuleId';
import {
	getConnectorMemoryDeclarations,
	getConnectorRow,
	isInputMemoryDeclaration,
} from '../connectors/memoryDeclarations';
import { getProjectMemoryExposureConnectors, isProjectMemoryExposureInput } from '../connectors/projectMemoryExposures';

const CONNECTOR_WIDTH_GRID_CELLS = 3;

export default function updateInputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.widgets.inputs = [];
	if (!graphicData.name) {
		return;
	}
	if (graphicData.nestedProjectCodeBlocks !== undefined) {
		getProjectMemoryExposureConnectors(graphicData, state).forEach(({ exposure, row }) => {
			if (!isProjectMemoryExposureInput(exposure)) return;

			const width = state.viewport.vGrid * CONNECTOR_WIDTH_GRID_CELLS;
			const height = state.viewport.hGrid;
			const x = 0;
			const y = row * state.viewport.hGrid;

			graphicData.widgets.inputs.push({
				width,
				height,
				x,
				y,
				wireX: Math.round(x + width / 2),
				wireY: Math.round(y + height / 2),
				id: exposure.name,
				wordAlignedAddress: exposure.targetMemory.wordAlignedAddress,
				codeBlock: graphicData,
			});
		});
		return;
	}

	const moduleId = getCodeBlockModuleId(graphicData);
	const plannedModule = state.compiler.memoryPlan.modules[moduleId];
	const memoryDefaults = state.compiler.memoryDefaultsByModuleId[moduleId];
	getConnectorMemoryDeclarations(plannedModule, memoryDefaults).forEach(declaration => {
		const { memory } = declaration;
		if (!isInputMemoryDeclaration(memory)) return;

		const width = state.viewport.vGrid * CONNECTOR_WIDTH_GRID_CELLS;
		const height = state.viewport.hGrid;
		const x = 0;
		const y = getConnectorRow(declaration, graphicData.gaps) * state.viewport.hGrid;

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
